import * as bip39 from 'bip39'
import * as bip32Factory from 'bip32'
import * as secp from 'tiny-secp256k1'
import * as bitcoin from 'bitcoinjs-lib'
import { Wallet } from 'ethers'
import { TronWeb } from 'tronweb'
import * as ed25519 from 'ed25519-hd-key'
import { Keypair, PublicKey } from '@solana/web3.js'
import { encodeAccountID } from 'ripple-address-codec'
import { Chain, DeriveOpts, DerivedAddress } from './types.js'
import { SLIP44, DEFAULT_PURPOSE } from './chains.js'

const bip32 = bip32Factory.BIP32Factory(secp)

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

export async function mnemonicToSeed(mnemonic: string, passphrase = ''): Promise<Buffer> {
  return bip39.mnemonicToSeed(mnemonic, passphrase)
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

/** BTC bech32 P2WPKH */
export function addressBTC(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('BTC', opts)
  const node = deriveNode(seed, path, bitcoin.networks.bitcoin)
  const { address } = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(node.publicKey), network: bitcoin.networks.bitcoin })
  const xpub = deriveXpub(seed, path, bitcoin.networks.bitcoin)
  return { chain: 'BTC', path, address: address!, privateKeyHex: Buffer.from(node.privateKey!).toString('hex'), xpub }
}

/** LTC bech32 P2WPKH */
export function addressLTC(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('LTC', opts)
  const node = deriveNode(seed, path, litecoin as any)
  const { address } = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(node.publicKey), network: litecoin as any })
  const xpub = deriveXpub(seed, path, litecoin as any)
  return { chain: 'LTC', path, address: address!, privateKeyHex: Buffer.from(node.privateKey!).toString('hex'), xpub }
}

/** DOGE legacy P2PKH */
export function addressDOGE(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('DOGE', opts)
  const node = deriveNode(seed, path, dogecoin as any)
  const { address } = bitcoin.payments.p2pkh({ pubkey: Buffer.from(node.publicKey), network: dogecoin as any })
  const xpub = deriveXpub(seed, path, dogecoin as any)
  return { chain: 'DOGE', path, address: address!, privateKeyHex: Buffer.from(node.privateKey!).toString('hex'), xpub }
}

/** ETH / EVM */
export function addressETH(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('ETH', opts)
  const node = deriveNode(seed, path)
  const priv = '0x' + Buffer.from(node.privateKey!).toString('hex')
  const wallet = new Wallet(priv)
  const xpub = deriveXpub(seed, path)
  return { chain: 'ETH', path, address: wallet.address, privateKeyHex: priv.slice(2), xpub }
}

/** BSC shares the same derivation as ETH; address format is the same */
export function addressBSC(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('BSC', opts)
  const node = deriveNode(seed, path)
  const priv = '0x' + Buffer.from(node.privateKey!).toString('hex')
  const wallet = new Wallet(priv)
  const xpub = deriveXpub(seed, path)
  return { chain: 'BSC', path, address: wallet.address, privateKeyHex: priv.slice(2), xpub }
}

/** TRX (Tron) — secp256k1 key, Tron base58 address via tronweb */
export function addressTRX(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('TRX', opts)
  const node = deriveNode(seed, path)
  const privHex = Buffer.from(node.privateKey!).toString('hex')
  const tronWeb = new (TronWeb as any)({ fullHost: 'https://api.trongrid.io' })
  const address = tronWeb.address.fromPrivateKey(privHex)
  const xpub = deriveXpub(seed, path)
  return { chain: 'TRX', path, address, privateKeyHex: privHex, xpub }
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
  return { chain: 'XRP', path, address, privateKeyHex: Buffer.from(node.privateKey!).toString('hex'), xpub }
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
    const { key } = ed25519.derivePath(path, seed.toString('hex'))
    const kp = Keypair.fromSeed(key)
    const pub = new PublicKey(kp.publicKey)
    
    return { 
      chain: 'SOL', 
      path, 
      address: pub.toBase58(), 
      privateKeyHex: Buffer.from(kp.secretKey).toString('hex') 
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
