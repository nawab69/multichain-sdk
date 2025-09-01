
# 📄 Multichain Seed SDK — Project Requirements

## 1. Project Overview

The goal is to build a **TypeScript SDK** that allows developers to derive **deterministic blockchain addresses** from a single **BIP-39 mnemonic/seed** across multiple chains.
For **v1**, the SDK will:

* Accept a BIP-39 mnemonic (or seed).
* Derive addresses for **BTC, ETH, BSC, DOGE, LTC, TRX, XRP, SOL**.
* Support configurable derivation paths (SLIP-44).
* Provide a minimal, modular API surface.
  **No encryption, signing, or balance queries** in this version.

---

## 2. Supported Chains (v1)

| Chain      | Derivation                     | Address Type            | Notes                                |
| ---------- | ------------------------------ | ----------------------- | ------------------------------------ |
| Bitcoin    | BIP84 (`m/84'/0'/0'/0/i`)      | Bech32 P2WPKH           | Use bitcoinjs-lib                    |
| Ethereum   | BIP44 (`m/44'/60'/0'/0/i`)     | EVM checksum            | Use ethers.js                        |
| Binance SC | BIP44 (`m/44'/60'/0'/0/i`)     | EVM checksum            | Same as ETH                          |
| Dogecoin   | BIP44 (`m/44'/3'/0'/0/i`)      | Legacy P2PKH            | No SegWit                            |
| Litecoin   | BIP84 (`m/84'/2'/0'/0/i`)      | Bech32 P2WPKH           | Litecoin params                      |
| Tron       | BIP44 (`m/44'/195'/0'/0/i`)    | Base58Check TRX         | Use tronweb                          |
| XRP        | BIP44 (`m/44'/144'/0'/0/i`)    | Ripple Base58           | Use ripple-address-codec             |
| Solana     | SLIP-0010 (`m/44'/501'/0'/0'`) | Ed25519 Pubkey (base58) | Use ed25519-hd-key + @solana/web3.js |

---

## 3. Functional Requirements

### 3.1 Core Features

* **Mnemonic → Seed** conversion (BIP-39).
* **Seed → Address derivation** per supported chain.
* Configurable `(account, change, index)` parameters.
* Return object should include:

  ```ts
  {
    chain: 'BTC' | 'ETH' | ...,
    path: string,        // derivation path used
    address: string,     // blockchain address
    privateKeyHex: string, // raw hex, no 0x prefix
    xpub?: string        // when applicable
  }
  ```

### 3.2 CLI/Demo Tool

* Simple script to generate addresses for all supported chains from a random mnemonic.
* Developer can run:

  ```bash
  npm run dev
  ```

### 3.3 Extensibility

* Code structured so it’s easy to add more chains (e.g., Polygon, Avalanche, Cardano, etc.) in future.

---

## 4. Non-Functional Requirements

* Written in **TypeScript**.
* Must compile to **ESM** + type declarations (`dist/`).
* No persistence (seed kept in memory only).
* Lightweight & modular (tree-shakable).
* Public API should be minimal (`mnemonicToSeed`, `deriveAddressForChain`).

---

## 5. Project Structure

```
multichain-seed-sdk/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts        # Public exports
│   ├── chains.ts       # SLIP44 + defaults
│   ├── derive.ts       # Core derivation logic
│   ├── types.ts        # Shared types
│   ├── demo.ts         # Example CLI/demo script
└── dist/               # Compiled JS + d.ts
```

---

## 6. Dependencies

### Runtime

* `bip39` → mnemonic ⇄ seed
* `bip32` + `tiny-secp256k1` → HD wallets (secp256k1)
* `bitcoinjs-lib` → BTC/LTC/DOGE addresses
* `ethers` → ETH/BSC addresses
* `tronweb` → Tron addresses
* `@solana/web3.js` + `ed25519-hd-key` → Solana ed25519 derivation
* `ripple-address-codec` → XRP addresses

### Dev

* `typescript`
* `ts-node`
* `@types/node`

---

## 7. Example API Usage

```ts
import { mnemonicToSeed, deriveAddressForChain } from 'multichain-seed-sdk'

const mnemonic = "seed phrase goes here ..."
const seed = await mnemonicToSeed(mnemonic)

// First Bitcoin address
const btc = deriveAddressForChain('BTC', seed, { index: 0 })
console.log(btc.address, btc.path)

// Ethereum 5th address
const eth = deriveAddressForChain('ETH', seed, { index: 5 })
console.log(eth.address, eth.path)

// Solana default address
const sol = deriveAddressForChain('SOL', seed)
console.log(sol.address, sol.path)
```

---

## 8. Deliverables

* ✅ SDK package (`npm run build` outputs `dist/`).
* ✅ Type definitions (`dist/index.d.ts`).
* ✅ Demo script (`npm run dev`) showing generated addresses for all chains.
* ✅ Documentation (README.md):

  * Install instructions
  * Supported chains
  * API examples
  * Roadmap (signing, balances, encryption).

---

## 9. Future Enhancements (not in v1)

* 🔒 Seed/xpriv encryption (AES-GCM + Argon2).
* ✍️ Transaction signing.
* 🔎 Balance queries (via RPC endpoints).
* 🌐 More chains (Polygon, Avalanche, Cosmos, etc.).
* 📦 Publish to npm.

---
