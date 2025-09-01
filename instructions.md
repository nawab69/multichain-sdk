It focuses purely on **address generation** from a BIP-39 mnemonic (or seed) for: **BTC, ETH, BSC, DOGE, LTC, TRX (Tron), XRP, SOL**.

It’s TypeScript, tree-shakable, and intentionally minimal so you can extend later (signing, balances, storage, etc.).

---

# 0) Project setup (in Cursor terminal)

```bash
mkdir multichain-seed-sdk && cd multichain-seed-sdk
npm init -y
npm i bip39 bip32 tiny-secp256k1 bitcoinjs-lib ethers tronweb @solana/web3.js ed25519-hd-key ripple-address-codec
npm i -D typescript ts-node @types/node
npx tsc --init
```

---

# 1) `package.json`

```json
{
  "name": "multichain-seed-sdk",
  "version": "0.1.0",
  "description": "Seed-only, no-encryption SDK to derive addresses for BTC/ETH/BSC/DOGE/LTC/TRX/XRP/SOL from a single mnemonic/seed.",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p .",
    "dev": "ts-node src/demo.ts",
    "typecheck": "tsc -p . --noEmit"
  },
  "keywords": ["bip39","bip32","slip44","bitcoin","ethereum","solana","tron","xrp","litecoin","dogecoin","evm","wallet","address"],
  "license": "MIT"
}
```

---

# 2) `tsconfig.json` (tweak from default)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

---

# 3) Source layout

```
src/
  index.ts
  chains.ts
  derive.ts
  demo.ts
  types.ts
```

---

## 3.1 `src/types.ts`

```ts
export type Chain =
  | 'BTC'
  | 'ETH'
  | 'BSC'
  | 'DOGE'
  | 'LTC'
  | 'TRX'
  | 'XRP'
  | 'SOL'

export interface DeriveOpts {
  /** account number (hardened) */
  account?: number
  /** 0 = external, 1 = internal/change */
  change?: 0 | 1
  /** address index */
  index?: number
  /** override full derivation path (advanced) */
  customPath?: string
}

export interface DerivedAddress {
  chain: Chain
  path: string
  address: string
  /** hex without 0x unless noted */
  privateKeyHex?: string
  /** optional base58 xpub for UTXO/EVM chains where applicable */
  xpub?: string
}
```

---

## 3.2 `src/chains.ts`

> Default SLIP-44 coin types & sensible address types. You can adjust `purpose` if you need legacy/semi-legacy for BTC/LTC.

```ts
export const SLIP44 = {
  BTC: 0,
  ETH: 60,
  BSC: 60,
  DOGE: 3,
  LTC: 2,
  TRX: 195,
  XRP: 144,
  SOL: 501
} as const

// Default purposes per chain (you can change to 44'/49'/84' for BTC/LTC)
export const DEFAULT_PURPOSE = {
  BTC: 84,  // bech32 P2WPKH
  LTC: 84,  // bech32 P2WPKH
  DOGE: 44, // legacy P2PKH
  ETH: 44,
  BSC: 44,
  TRX: 44,
  XRP: 44,
  SOL: 44   // SLIP-0010 ed25519
} as const
```

---

## 3.3 `src/derive.ts`

> Core derivation logic. Accepts mnemonic or seed buffer. Generates addresses for each chain.

```ts
import * as bip39 from 'bip39'
import * as bip32Factory from 'bip32'
import * as secp from 'tiny-secp256k1'
import * as bitcoin from 'bitcoinjs-lib'
import { Wallet } from 'ethers'
import TronWeb from 'tronweb'
import * as ed25519 from 'ed25519-hd-key'
import { Keypair, PublicKey } from '@solana/web3.js'
import { encodeAccountID } from 'ripple-address-codec'
import { Chain, DeriveOpts, DerivedAddress } from './types'
import { SLIP44, DEFAULT_PURPOSE } from './chains'

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

  // Solana commonly uses m/44'/501'/account'/0'
  if (chain === 'SOL') {
    return `m/${purpose}'/${coin}'/${account}'/0'`
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
  const { address } = bitcoin.payments.p2wpkh({ pubkey: node.publicKey, network: bitcoin.networks.bitcoin })
  const xpub = deriveXpub(seed, path, bitcoin.networks.bitcoin)
  return { chain: 'BTC', path, address: address!, privateKeyHex: node.privateKey!.toString('hex'), xpub }
}

/** LTC bech32 P2WPKH */
export function addressLTC(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('LTC', opts)
  const node = deriveNode(seed, path, litecoin as any)
  const { address } = bitcoin.payments.p2wpkh({ pubkey: node.publicKey, network: litecoin as any })
  const xpub = deriveXpub(seed, path, litecoin as any)
  return { chain: 'LTC', path, address: address!, privateKeyHex: node.privateKey!.toString('hex'), xpub }
}

/** DOGE legacy P2PKH */
export function addressDOGE(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('DOGE', opts)
  const node = deriveNode(seed, path, dogecoin as any)
  const { address } = bitcoin.payments.p2pkh({ pubkey: node.publicKey, network: dogecoin as any })
  const xpub = deriveXpub(seed, path, dogecoin as any)
  return { chain: 'DOGE', path, address: address!, privateKeyHex: node.privateKey!.toString('hex'), xpub }
}

/** ETH / EVM */
export function addressETH(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('ETH', opts)
  const node = deriveNode(seed, path)
  const priv = '0x' + node.privateKey!.toString('hex')
  const wallet = new Wallet(priv)
  const xpub = deriveXpub(seed, path)
  return { chain: 'ETH', path, address: wallet.address, privateKeyHex: priv.slice(2), xpub }
}

/** BSC shares the same derivation as ETH; address format is the same */
export function addressBSC(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('BSC', opts)
  const node = deriveNode(seed, path)
  const priv = '0x' + node.privateKey!.toString('hex')
  const wallet = new Wallet(priv)
  const xpub = deriveXpub(seed, path)
  return { chain: 'BSC', path, address: wallet.address, privateKeyHex: priv.slice(2), xpub }
}

/** TRX (Tron) — secp256k1 key, Tron base58 address via tronweb */
export function addressTRX(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('TRX', opts)
  const node = deriveNode(seed, path)
  const privHex = node.privateKey!.toString('hex')
  const tronWeb = new (TronWeb as any)({ fullHost: 'https://api.trongrid.io' })
  const address = tronWeb.address.fromPrivateKey(privHex)
  const xpub = deriveXpub(seed, path)
  return { chain: 'TRX', path, address, privateKeyHex: privHex, xpub }
}

/** XRP — derive secp256k1 pubkey then XRPL classic address (base58 ripple alphabet) */
export function addressXRP(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('XRP', opts)
  const node = deriveNode(seed, path)
  const pubkey = node.publicKey // compressed secp256k1

  // XRP account ID = RIPEMD160(SHA256(pubkey))
  const sha256 = bitcoin.crypto.sha256(pubkey)
  const accountId = bitcoin.crypto.ripemd160(sha256)
  const address = encodeAccountID(accountId) // "r..."

  const xpub = deriveXpub(seed, path)
  return { chain: 'XRP', path, address, privateKeyHex: node.privateKey!.toString('hex'), xpub }
}

/** SOL — ed25519 via SLIP-0010 (no xpub concept in BIP32 sense) */
export function addressSOL(seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  const path = buildPath('SOL', opts)
  const { key } = ed25519.derivePath(path, seed) // 32-byte seed for ed25519
  const kp = Keypair.fromSeed(key)
  const pub = new PublicKey(kp.publicKey)
  return { chain: 'SOL', path, address: pub.toBase58(), privateKeyHex: Buffer.from(kp.secretKey).toString('hex') }
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
```

---

## 3.4 `src/index.ts`

> Public API surface — small and friendly.

```ts
export { mnemonicToSeed } from './derive'
export { deriveAddressForChain } from './derive'
export * from './types'
```

---

## 3.5 `src/demo.ts`

> Run `npm run dev` to see addresses derived for all supported chains.

```ts
import * as bip39 from 'bip39'
import { mnemonicToSeed, deriveAddressForChain } from './index'
import type { Chain } from './types'

async function main() {
  // DEV DEMO ONLY — in production you’ll collect mnemonic from secure UX flow
  const mnemonic = bip39.generateMnemonic(256)
  console.log('Mnemonic (DEMO):', mnemonic)

  const seed = await mnemonicToSeed(mnemonic)

  const chains: Chain[] = ['BTC','ETH','BSC','DOGE','LTC','TRX','XRP','SOL']

  for (const c of chains) {
    const a0 = deriveAddressForChain(c, seed, { account: 0, change: 0, index: 0 })
    const a1 = deriveAddressForChain(c, seed, { account: 0, change: 0, index: 1 })
    console.log(c, '→', a0.address, 'path:', a0.path)
    console.log(c, '→', a1.address, 'path:', a1.path)
  }
}

main().catch(console.error)
```

---

# 4) Build & run

```bash
npm run dev   # runs demo
npm run build # emits dist/
```

---

# 5) How to use (example)

```ts
import { mnemonicToSeed, deriveAddressForChain } from 'multichain-seed-sdk'

const seed = await mnemonicToSeed('your twelve or twenty four words here')
const eth0 = deriveAddressForChain('ETH', seed, { index: 0 })
const btc5 = deriveAddressForChain('BTC', seed, { index: 5 })
const sol0 = deriveAddressForChain('SOL', seed) // uses m/44'/501'/0'/0' by default

console.log(eth0.address, eth0.path) // 0x...
console.log(btc5.address, btc5.path) // bc1...
console.log(sol0.address, sol0.path) // 1111... (base58)
```

---

# 6) Notes / gotchas

* **Address types**

  * BTC/LTC defaults are **bech32 P2WPKH** via `purpose=84'`. Change `DEFAULT_PURPOSE` if you want legacy (44’) or P2SH-SegWit (49’).
  * DOGE uses legacy P2PKH (no SegWit).
  * ETH/BSC share derivation; addresses are EVM checksum.
  * TRX uses the same secp256k1 key as EVM but a different **address encoding** (handled by `tronweb`).
  * XRP address is derived by `RIPEMD160(SHA256(pubkey))` then Ripple base58; we rely on `ripple-address-codec`.
  * SOL uses **ed25519** via SLIP-0010; no BIP32 xpub concept.

* **Xpubs**

  * Included for BTC/LTC/DOGE (and technically EVM derivation), but **not** for SOL and XRP (there’s no standard BIP32 xpub usage in the same sense).

* **No encryption** (as requested). You’ll add it later.

* **Indexing / discovery**

  * Track `(account, change, index)` you’ve issued so you can re-derive deterministically.

---

# 7) Next steps you can add later

* Add `getXpub(chain, account)` helpers.
* Implement **PSBT signing** (BTC/LTC/DOGE) and normal signing for EVM/TRX/XRP/SOL.
* Add **encryption** of the seed/xpriv with AES-GCM + Argon2.
* Gap-limit scanning for UTXO chains; nonce tracking for EVM/TRX; sequence for XRP; recent blockhash for SOL.
* Publish as private npm or monorepo package.

---

If you want, I can also spin this into a **small monorepo** with a `examples/` folder and minimal unit tests so you can grow it into your WaaS SDK.
