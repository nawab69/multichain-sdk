import * as bip39 from 'bip39'
import * as bip32Factory from 'bip32'
import * as secp from 'tiny-secp256k1'
import * as bitcoin from 'bitcoinjs-lib'
import { Wallet } from 'ethers'
import keccak from 'keccak'
import { TronWeb } from 'tronweb'
import * as ed25519 from 'ed25519-hd-key'
import { Keypair, PublicKey } from '@solana/web3.js'
import { encodeAccountID } from 'ripple-address-codec'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { keccak256 } from 'ethereum-cryptography/keccak'
import { Chain, DeriveOpts, DerivedAddress, XPubResult, WatchOnlyAddress } from './types.js'
import { SLIP44, DEFAULT_PURPOSE, TESTNET_NETWORKS, REGTEST_NETWORKS } from './chains.js'

const bip32 = bip32Factory.BIP32Factory(secp)

/** Expand a compressed secp256k1 public key (33B) to uncompressed (65B). */
function decompressPubkey(compressed: Uint8Array): Uint8Array {
  const P = secp256k1.Point.fromHex(Buffer.from(compressed).toString('hex'))
  return P.toBytes(false) // false -> uncompressed (65 bytes, 0x04 || X || Y)
}

/** ETH address from uncompressed secp256k1 pubkey with EIP-55 checksum */
function ethAddressFromUncompressed(uncompressed: Uint8Array): string {
  // drop the 0x04 prefix, keccak hash of 64 bytes, take last 20 bytes
  const body = uncompressed.slice(1)
  const hash = keccak256(body)
  const addr = Buffer.from(hash.slice(-20)).toString('hex')
  // EIP-55 checksum
  const chk = keccak256(Buffer.from(addr, 'utf8'))
  let out = '0x'
  for (let i = 0; i < addr.length; i++) {
    const nibble = parseInt(chk[i >> 1].toString(16), 16)
    const upper = (i % 2 === 0 ? (nibble >> 4) : (nibble & 0xf)) >= 8
    out += upper ? addr[i].toUpperCase() : addr[i]
  }
  return out
}

// Networks for bitcoinjs-lib (LTC & DOGE custom)
const litecoin = {
  messagePrefix: '\x19Litecoin Signed Message:\n',
  bech32: 'ltc',
  bip32: { public: 0x019da462, private: 0x019d9cfe },
  pubKeyHash: 0x30,
  scriptHash: 0x32,
  wif: 0xb0
}

const dogecoin = {
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  bech32: null as any,
  bip32: { public: 0x02facafd, private: 0x02fac398 },
  pubKeyHash: 0x1e,
  scriptHash: 0x16,
  wif: 0x9e
}

// Testnet network configurations
const testnetNetworks = {
  BTC: bitcoin.networks.testnet,
  LTC: {
    ...litecoin,
    bech32: 'tltc',
    pubKeyHash: 0x6f,
    scriptHash: 0x3a,
    wif: 0xef
  },
  DOGE: {
    ...dogecoin,
    pubKeyHash: 0x71,
    scriptHash: 0xc4,
    wif: 0xf1
  }
}

// Regtest network configurations (local development networks)
const regtestNetworks = {
  BTC: bitcoin.networks.regtest,
  LTC: {
    ...litecoin,
    bech32: 'rltc', // regtest bech32 prefix
    pubKeyHash: 0x6f, // same as testnet
    scriptHash: 0x3a, // same as testnet
    wif: 0xef // same as testnet
  },
  DOGE: {
    ...dogecoin,
    pubKeyHash: 0x71, // same as testnet
    scriptHash: 0xc4, // same as testnet
    wif: 0xf1 // same as testnet
  }
}

export async function mnemonicToSeed(mnemonic: string, passphrase = ''): Promise<Buffer> {
  return bip39.mnemonicToSeed(mnemonic, passphrase)
}

/** Get the appropriate network for BTC/LTC/DOGE based on opts */
function getNetwork(chain: 'BTC' | 'LTC' | 'DOGE', opts?: DeriveOpts): bitcoin.networks.Network {
  if (opts?.regtest) {
    return regtestNetworks[chain] as any
  }
  if (opts?.testnet) {
    return testnetNetworks[chain] as any
  }
  // Mainnet
  switch (chain) {
    case 'BTC': return bitcoin.networks.bitcoin
    case 'LTC': return litecoin as any
    case 'DOGE': return dogecoin as any
  }
}

/** Build standard BIP44/49/84 path m/purpose'/coin'/account'/change/index */
function buildPath(chain: Chain, opts?: DeriveOpts): string {
  if (opts?.customPath) return opts.customPath
  const purpose = DEFAULT_PURPOSE[chain]
  const coin = SLIP44[chain]
  const account = opts?.account ?? 0
  const change = opts?.change ?? 0
  const index = opts?.index ?? 0

  // Solana commonly uses m/44'/501'/account' (Trust Wallet style - account level only)
  if (chain === 'SOL') {
    return `m/${purpose}'/${coin}'/${account}'`
  }
  return `m/${purpose}'/${coin}'/${account}'/${change}/${index}`
}

function deriveNode(seed: Buffer, path: string, network?: bitcoin.networks.Network) {
  const root = bip32.fromSeed(seed, network)
  return root.derivePath(path)
}

function deriveXpub(seed: Buffer, path: string, network?: bitcoin.networks.Network): string | undefined {
  // xpub should be at the parent of the last index (account/change level)
  const parentPath = path.split('/').slice(0, -1).join('/')
  const node = bip32.fromSeed(seed, network).derivePath(parentPath)
  return node.neutered().toBase58()
}

function deriveFullXpub(seed: Buffer, path: string, network?: bitcoin.networks.Network): string | undefined {
  // Full xpub with private key capability for watch-only functionality
  const parentPath = path.split('/').slice(0, -1).join('/')
  const node = bip32.fromSeed(seed, network).derivePath(parentPath)
  return node.toBase58() // Full xpub with private key capability
}

/** BTC bech32 P2WPKH */
export function addressBTC(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('BTC', opts)
  const network = getNetwork('BTC', opts)
  const node = deriveNode(seed, path, network)
  const { address } = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(node.publicKey), network })
  const xpub = deriveXpub(seed, path, network)
  return { chain: 'BTC', path, address: address!, privateKeyHex: Buffer.from(node.privateKey!).toString('hex'), xpub }
}

/** LTC bech32 P2WPKH */
export function addressLTC(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('LTC', opts)
  const network = getNetwork('LTC', opts)
  const node = deriveNode(seed, path, network as any)
  const { address } = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(node.publicKey), network: network as any })
  const xpub = deriveXpub(seed, path, network as any)
  return { chain: 'LTC', path, address: address!, privateKeyHex: Buffer.from(node.privateKey!).toString('hex'), xpub }
}

/** DOGE legacy P2PKH */
export function addressDOGE(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('DOGE', opts)
  const network = getNetwork('DOGE', opts)
  const node = deriveNode(seed, path, network as any)
  const { address } = bitcoin.payments.p2pkh({ pubkey: Buffer.from(node.publicKey), network: network as any })
  const xpub = deriveXpub(seed, path, network as any)
  return { chain: 'DOGE', path, address: address!, privateKeyHex: Buffer.from(node.privateKey!).toString('hex'), xpub }
}

/** ETH / EVM */
export function addressETH(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('ETH', opts)
  const node = deriveNode(seed, path)
  const priv = '0x' + Buffer.from(node.privateKey!).toString('hex')
  
  // For testnet, we can't change the address format, but we can add network info
  const wallet = new Wallet(priv)
  const xpub = deriveXpub(seed, path)
  
  return { 
    chain: 'ETH', 
    path, 
    address: wallet.address, 
    privateKeyHex: priv.slice(2), 
    xpub,
    // Add network indicator if needed
    ...(opts?.testnet && { testnet: true }),
    ...(opts?.regtest && { regtest: true })
  }
}

/** BSC shares the same derivation as ETH; address format is the same */
export function addressBSC(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('BSC', opts)
  const node = deriveNode(seed, path)
  const priv = '0x' + Buffer.from(node.privateKey!).toString('hex')
  const wallet = new Wallet(priv)
  const xpub = deriveXpub(seed, path)
  
  return { 
    chain: 'BSC', 
    path, 
    address: wallet.address, 
    privateKeyHex: priv.slice(2), 
    xpub,
    // Add network indicator if needed
    ...(opts?.testnet && { testnet: true }),
    ...(opts?.regtest && { regtest: true })
  }
}

/** TRX (Tron) — secp256k1 key, Tron base58 address via tronweb */
export function addressTRX(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('TRX', opts)
  const node = deriveNode(seed, path)
  const privHex = Buffer.from(node.privateKey!).toString('hex')
  
  // Use Shasta testnet for testnet, localhost for regtest, mainnet for production
  const fullHost = opts?.regtest
    ? 'http://127.0.0.1:8090' // Default local Tron node
    : opts?.testnet 
    ? 'https://api.shasta.trongrid.io' 
    : 'https://api.trongrid.io'
  
  const tronWeb = new (TronWeb as any)({ fullHost })
  const address = tronWeb.address.fromPrivateKey(privHex)
  const xpub = deriveXpub(seed, path)
  
  return { 
    chain: 'TRX', 
    path, 
    address, 
    privateKeyHex: privHex, 
    xpub,
    // Add network indicator if needed
    ...(opts?.testnet && { testnet: true }),
    ...(opts?.regtest && { regtest: true })
  }
}

/** XRP — derive secp256k1 pubkey then XRPL classic address (base58 ripple alphabet) */
export function addressXRP(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('XRP', opts)
  const node = deriveNode(seed, path)
  const pubkey = Buffer.from(node.publicKey) // compressed secp256k1

  // XRP account ID = RIPEMD160(SHA256(pubkey))
  const sha256 = bitcoin.crypto.sha256(pubkey)
  const accountId = bitcoin.crypto.ripemd160(sha256)
  const address = encodeAccountID(accountId) // "r..."

  const xpub = deriveXpub(seed, path)
  
  return { 
    chain: 'XRP', 
    path, 
    address, 
    privateKeyHex: Buffer.from(node.privateKey!).toString('hex'), 
    xpub,
    // Add network indicator if needed
    ...(opts?.testnet && { testnet: true }),
    ...(opts?.regtest && { regtest: true })
  }
}

/** SOL — ed25519 via SLIP-0010 (Trust Wallet style - account level derivation) */
export function addressSOL(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  // For Trust Wallet Solana, we use account level derivation
  // m/44'/501'/account' where account increments for different addresses
  const account = opts?.account ?? 0
  const index = opts?.index ?? 0
  
  // Trust Wallet style: use index as account number
  const trustWalletAccount = account + index
  const path = `m/44'/501'/${trustWalletAccount}'`
  
  try {
    const { key: priv32 } = ed25519.derivePath(path, seed.toString('hex'))
    const kp = Keypair.fromSeed(priv32)
    const pub = new PublicKey(kp.publicKey)
    
    // For Trust Wallet compatibility, provide the 32-byte private key (seed)
    const privateKeyHex = Buffer.from(priv32).toString('hex') // 64 hex chars (32 bytes)
    
    return { 
      chain: 'SOL', 
      path, 
      address: pub.toBase58(), 
      // Trust Wallet format (32-byte private key)
      privateKeyHex, // 64 hex chars (32 bytes)
      // Additional format for compatibility
      privateKeyArray: Array.from(priv32), // 32-byte array
      // Add network indicator if needed
      ...(opts?.testnet && { testnet: true }),
      ...(opts?.regtest && { regtest: true })
    }
  } catch (error) {
    throw new Error(`Failed to derive Solana address: ${error}`)
  }
}

export function deriveAddressForChain(
  chain: Chain,
  seed: Buffer,
  opts?: DeriveOpts
): DerivedAddress {
  switch (chain) {
    case 'BTC': return addressBTC(seed, opts)
    case 'LTC': return addressLTC(seed, opts)
    case 'DOGE': return addressDOGE(seed, opts)
    case 'ETH': return addressETH(seed, opts)
    case 'BSC': return addressBSC(seed, opts)
    case 'TRX': return addressTRX(seed, opts)
    case 'XRP': return addressXRP(seed, opts)
    case 'SOL': return addressSOL(seed, opts)
  }
}

// ===== XPUB DERIVATION FUNCTIONS =====

/** Derive xpub for BTC */
export function deriveXPubBTC(seed: Buffer, opts?: DeriveOpts): XPubResult {
  const account = opts?.account ?? 0
  const change = opts?.change ?? 0
  const index = opts?.index ?? 0
  const fullPath = `m/84'/0'/${account}'/${change}/${index}` // Full path like original
  const network = getNetwork('BTC', opts)
  const xpub = deriveXpub(seed, fullPath, network) // Keep using neutered xpub for BTC
  
  return {
    chain: 'BTC',
    path: fullPath,
    xpub: xpub!,
    network: opts?.regtest ? 'regtest' : opts?.testnet ? 'testnet' : 'mainnet'
  }
}

/** Derive xpub for LTC */
export function deriveXPubLTC(seed: Buffer, opts?: DeriveOpts): XPubResult {
  const account = opts?.account ?? 0
  const change = opts?.change ?? 0
  const index = opts?.index ?? 0
  const fullPath = `m/84'/2'/${account}'/${change}/${index}` // Full path like original
  // Force use of standard Bitcoin network for xpub derivation to ensure proper neutering
  const network = opts?.regtest ? bitcoin.networks.regtest : opts?.testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
  const xpub = deriveXpub(seed, fullPath, network)
  
  return {
    chain: 'LTC',
    path: fullPath,
    xpub: xpub!,
    network: opts?.regtest ? 'regtest' : opts?.testnet ? 'testnet' : 'mainnet'
  }
}

/** Derive xpub for DOGE */
export function deriveXPubDOGE(seed: Buffer, opts?: DeriveOpts): XPubResult {
  const account = opts?.account ?? 0
  const change = opts?.change ?? 0
  const index = opts?.index ?? 0
  const fullPath = `m/44'/3'/${account}'/${change}/${index}` // Full path like original
  // Force use of standard Bitcoin network for xpub derivation to ensure proper neutering
  const network = opts?.regtest ? bitcoin.networks.regtest : opts?.testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
  const xpub = deriveXpub(seed, fullPath, network)
  
  return {
    chain: 'DOGE',
    path: fullPath,
    xpub: xpub!,
    network: opts?.regtest ? 'regtest' : opts?.testnet ? 'testnet' : 'mainnet'
  }
}

/** Derive xpub for ETH */
export function deriveXPubETH(seed: Buffer, opts?: DeriveOpts): XPubResult {
  const account = opts?.account ?? 0
  const change = opts?.change ?? 0
  const index = opts?.index ?? 0
  const fullPath = `m/44'/60'/${account}'/${change}/${index}` // Full path like original
  const xpub = deriveXpub(seed, fullPath) // Use neutered xpub for true watch-only functionality
  
  return {
    chain: 'ETH',
    path: fullPath,
    xpub: xpub!,
    network: opts?.regtest ? 'regtest' : opts?.testnet ? 'testnet' : 'mainnet'
  }
}

/** Derive xpub for BSC */
export function deriveXPubBSC(seed: Buffer, opts?: DeriveOpts): XPubResult {
  const account = opts?.account ?? 0
  const change = opts?.change ?? 0
  const index = opts?.index ?? 0
  const fullPath = `m/44'/60'/${account}'/${change}/${index}` // Full path like original
  const xpub = deriveXpub(seed, fullPath) // Use neutered xpub for true watch-only functionality
  
  return {
    chain: 'BSC',
    path: fullPath,
    xpub: xpub!,
    network: opts?.regtest ? 'regtest' : opts?.testnet ? 'testnet' : 'mainnet'
  }
}

/** Derive xpub for TRX */
export function deriveXPubTRX(seed: Buffer, opts?: DeriveOpts): XPubResult {
  const account = opts?.account ?? 0
  const change = opts?.change ?? 0
  const index = opts?.index ?? 0
  const fullPath = `m/44'/195'/${account}'/${change}/${index}` // Full path like original
  const xpub = deriveXpub(seed, fullPath) // Use neutered xpub for true watch-only functionality
  
  return {
    chain: 'TRX',
    path: fullPath,
    xpub: xpub!,
    network: opts?.regtest ? 'regtest' : opts?.testnet ? 'testnet' : 'mainnet'
  }
}

/** Derive xpub for XRP */
export function deriveXPubXRP(seed: Buffer, opts?: DeriveOpts): XPubResult {
  const account = opts?.account ?? 0
  const change = opts?.change ?? 0
  const index = opts?.index ?? 0
  const fullPath = `m/44'/144'/${account}'/${change}/${index}` // Full path like original
  const xpub = deriveXpub(seed, fullPath) // Keep using neutered xpub for XRP
  
  return {
    chain: 'XRP',
    path: fullPath,
    xpub: xpub!,
    network: opts?.regtest ? 'regtest' : opts?.testnet ? 'testnet' : 'mainnet'
  }
}

/** Derive xpub for a specific chain */
export function deriveXPubForChain(
  chain: Chain,
  seed: Buffer,
  opts?: DeriveOpts
): XPubResult {
  switch (chain) {
    case 'BTC': return deriveXPubBTC(seed, opts)
    case 'LTC': return deriveXPubLTC(seed, opts)
    case 'DOGE': return deriveXPubDOGE(seed, opts)
    case 'ETH': return deriveXPubETH(seed, opts)
    case 'BSC': return deriveXPubBSC(seed, opts)
    case 'TRX': return deriveXPubTRX(seed, opts)
    case 'XRP': return deriveXPubXRP(seed, opts)
    case 'SOL': throw new Error('Solana does not support xpub derivation (uses ed25519)')
  }
}

// ===== WATCH-ONLY ADDRESS DERIVATION FUNCTIONS =====

/** Derive watch-only address from xpub for BTC */
export function deriveWatchOnlyBTC(xpub: string, change: 0 | 1, index: number, testnet = false, regtest = false): WatchOnlyAddress {
  const network = regtest ? regtestNetworks.BTC : testnet ? testnetNetworks.BTC : bitcoin.networks.bitcoin
  const node = bip32.fromBase58(xpub, network)
  const child = node.derive(index) // xpub is already at change level, just derive index
  const path = `m/84'/0'/0'/${change}/${index}`
  
  const { address } = bitcoin.payments.p2wpkh({ 
    pubkey: Buffer.from(child.publicKey), 
    network 
  })
  
  return {
    chain: 'BTC',
    path,
    address: address!,
    xpub
  }
}

/** Derive watch-only address from xpub for LTC */
export function deriveWatchOnlyLTC(xpub: string, change: 0 | 1, index: number, testnet = false, regtest = false): WatchOnlyAddress {
  // Parse xpub using standard Bitcoin network (since xpub was generated with standard network)
  const xpubNetwork = regtest ? bitcoin.networks.regtest : testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
  const node = bip32.fromBase58(xpub, xpubNetwork)
  const child = node.derive(index) // xpub is already at change level, just derive index
  const path = `m/84'/2'/0'/${change}/${index}`
  
  // Generate address using LTC-specific network
  const addressNetwork = regtest ? regtestNetworks.LTC : testnet ? testnetNetworks.LTC : litecoin
  const { address } = bitcoin.payments.p2wpkh({ 
    pubkey: Buffer.from(child.publicKey), 
    network: addressNetwork as any 
  })
  
  return {
    chain: 'LTC',
    path,
    address: address!,
    xpub
  }
}

/** Derive watch-only address from xpub for DOGE */
export function deriveWatchOnlyDOGE(xpub: string, change: 0 | 1, index: number, testnet = false, regtest = false): WatchOnlyAddress {
  // Parse xpub using standard Bitcoin network (since xpub was generated with standard network)
  const xpubNetwork = regtest ? bitcoin.networks.regtest : testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
  const node = bip32.fromBase58(xpub, xpubNetwork)
  const child = node.derive(index) // xpub is already at change level, just derive index
  const path = `m/44'/3'/0'/${change}/${index}`
  
  // Generate address using DOGE-specific network
  const addressNetwork = regtest ? regtestNetworks.DOGE : testnet ? testnetNetworks.DOGE : dogecoin
  const { address } = bitcoin.payments.p2pkh({ 
    pubkey: Buffer.from(child.publicKey), 
    network: addressNetwork as any 
  })
  
  return {
    chain: 'DOGE',
    path,
    address: address!,
    xpub
  }
}

/** Derive watch-only address from xpub for ETH */
export function deriveWatchOnlyETH(xpub: string, change: 0 | 1, index: number): WatchOnlyAddress {
  const node = bip32.fromBase58(xpub)
  const child = node.derive(index) // xpub is already at change level, just derive index
  const path = `m/44'/60'/0'/${change}/${index}`
  
  // Use proper ETH address derivation with EIP-55 checksum
  const compressed = child.publicKey // 33 bytes
  const uncompressed = decompressPubkey(compressed)
  const address = ethAddressFromUncompressed(uncompressed)
  
  return {
    chain: 'ETH',
    path,
    address,
    xpub
  }
}

/** Derive watch-only address from xpub for BSC */
export function deriveWatchOnlyBSC(xpub: string, change: 0 | 1, index: number): WatchOnlyAddress {
  const node = bip32.fromBase58(xpub)
  const child = node.derive(index) // xpub is already at change level, just derive index
  const path = `m/44'/60'/0'/${change}/${index}`
  
  // Use proper ETH address derivation with EIP-55 checksum (BSC uses same format)
  const compressed = child.publicKey // 33 bytes
  const uncompressed = decompressPubkey(compressed)
  const address = ethAddressFromUncompressed(uncompressed)
  
  return {
    chain: 'BSC',
    path,
    address,
    xpub
  }
}

/** Derive watch-only address from xpub for TRX */
export function deriveWatchOnlyTRX(xpub: string, change: 0 | 1, index: number, testnet = false, regtest = false): WatchOnlyAddress {
  const node = bip32.fromBase58(xpub)
  const child = node.derive(index) // xpub is already at change level, just derive index
  const path = `m/44'/195'/0'/${change}/${index}`
  
  // TRX address generation from public key:
  // 1. Take the compressed public key (33 bytes)
  // 2. Decompress to uncompressed public key (65 bytes)
  // 3. Remove the 0x04 prefix (64 bytes)
  // 4. Compute Keccak-256 hash (NOT SHA3-256!)
  // 5. Take last 20 bytes
  // 6. Prefix with 0x41 (21 bytes total)
  // 7. Encode with Base58Check
  
  const compressedPubKey = child.publicKey // 33 bytes
  
  // Decompress the public key to get uncompressed format (65 bytes)
  const uncompressedPubKey = decompressPubkey(compressedPubKey)
  
  // Remove the 0x04 prefix to get 64 bytes
  const pubKeyBody = uncompressedPubKey.slice(1) // Remove first byte (0x04)
  
  // Compute Keccak-256 hash of the 64-byte public key body (TRX uses Keccak-256, not SHA3-256!)
  const keccakHash = keccak('keccak256').update(Buffer.from(pubKeyBody)).digest()
  
  // Take last 20 bytes and prefix with 0x41
  const addressBytes = Buffer.concat([
    Buffer.from([0x41]), // TRX address prefix
    keccakHash.slice(-20)  // Last 20 bytes of hash
  ])
  
  // Encode with Base58Check (using bitcoinjs-lib's base58check)
  const address = bitcoin.address.toBase58Check(addressBytes.slice(1), addressBytes[0])
  
  return {
    chain: 'TRX',
    path,
    address,
    xpub
  }
}

/** Derive watch-only address from xpub for XRP */
export function deriveWatchOnlyXRP(xpub: string, change: 0 | 1, index: number): WatchOnlyAddress {
  const node = bip32.fromBase58(xpub)
  const child = node.derive(index) // xpub is already at change level, just derive index
  const path = `m/44'/144'/0'/${change}/${index}`
  
  const pubkey = Buffer.from(child.publicKey)
  const sha256 = bitcoin.crypto.sha256(pubkey)
  const accountId = bitcoin.crypto.ripemd160(sha256)
  const address = encodeAccountID(accountId)
  
  return {
    chain: 'XRP',
    path,
    address,
    xpub
  }
}

/** Derive watch-only address from xpub for a specific chain */
export function deriveWatchOnlyAddress(
  chain: Chain,
  xpub: string,
  change: 0 | 1,
  index: number,
  testnet = false,
  regtest = false
): WatchOnlyAddress {
  switch (chain) {
    case 'BTC': return deriveWatchOnlyBTC(xpub, change, index, testnet, regtest)
    case 'LTC': return deriveWatchOnlyLTC(xpub, change, index, testnet, regtest)
    case 'DOGE': return deriveWatchOnlyDOGE(xpub, change, index, testnet, regtest)
    case 'ETH': return deriveWatchOnlyETH(xpub, change, index)
    case 'BSC': return deriveWatchOnlyBSC(xpub, change, index)
    case 'TRX': return deriveWatchOnlyTRX(xpub, change, index, testnet, regtest)
    case 'XRP': return deriveWatchOnlyXRP(xpub, change, index)
    case 'SOL': throw new Error('Solana does not support watch-only derivation (uses ed25519)')
  }
}
