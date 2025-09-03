# Multichain Seed SDK

A TypeScript SDK for deriving deterministic blockchain addresses from a single BIP-39 mnemonic/seed across multiple chains.

## Features

- **Seed-only**: No encryption or signing - purely address derivation
- **Multi-chain support**: BTC, ETH, BSC, DOGE, LTC, TRX, XRP, SOL
- **BIP-39/BIP-32 compliant**: Standard HD wallet derivation paths
- **Watch-only addresses**: Derive addresses from xpubs without private keys
- **Testnet support**: Generate testnet addresses for development and testing
- **Tree-shakable**: Only import what you need
- **TypeScript**: Full type safety and IntelliSense

## Installation

```bash
npm install @nawab_kibria/multichain-sdk
```

## Quick Start

### Basic Address Derivation

```typescript
import { mnemonicToSeed, deriveAddressForChain } from '@nawab_kibria/multichain-sdk'

const mnemonic = "your twelve or twenty four words here"
const seed = await mnemonicToSeed(mnemonic)

// Derive addresses for different chains
const eth0 = deriveAddressForChain('ETH', seed, { index: 0 })
const btc5 = deriveAddressForChain('BTC', seed, { index: 5 })
const sol0 = deriveAddressForChain('SOL', seed) // uses m/44'/501'/0'/0' by default

console.log(eth0.address, eth0.path) // 0x...
console.log(btc5.address, btc5.path) // bc1...
console.log(sol0.address, sol0.path) // 1111... (base58)

// Generate testnet addresses
const btcTestnet = deriveAddressForChain('BTC', seed, { index: 0, testnet: true })
console.log(btcTestnet.address, btcTestnet.path) // tb1... (testnet)
```

### Watch-Only Address Derivation

```typescript
import { mnemonicToSeed, deriveXPubForChain, deriveWatchOnlyAddress } from '@nawab_kibria/multichain-sdk'

const mnemonic = "your twelve or twenty four words here"
const seed = await mnemonicToSeed(mnemonic)

// Derive xpub for watch-only functionality
const xpub = deriveXPubForChain('ETH', seed, { account: 0, change: 0, index: 0 })
console.log('XPub:', xpub.xpub) // xpub6... (secure, no private keys)

// Derive addresses from xpub (watch-only)
const watchOnly0 = deriveWatchOnlyAddress('ETH', xpub.xpub, 0, 0)
const watchOnly1 = deriveWatchOnlyAddress('ETH', xpub.xpub, 0, 1)
const watchOnly2 = deriveWatchOnlyAddress('ETH', xpub.xpub, 0, 2)

console.log('Watch-only addresses:', watchOnly0.address, watchOnly1.address, watchOnly2.address)

// These addresses match the seed-derived addresses exactly!
const direct0 = deriveAddressForChain('ETH', seed, { index: 0 })
console.log('Match:', watchOnly0.address === direct0.address) // true
```

## Supported Chains

| Chain      | Derivation                     | Address Type            | Watch-Only | Notes                                |
| ---------- | ------------------------------ | ----------------------- | ---------- | ------------------------------------ |
| Bitcoin    | BIP84 (`m/84'/0'/0'/0/i`)      | Bech32 P2WPKH           | ✅         | Modern SegWit                        |
| Ethereum   | BIP44 (`m/44'/60'/0'/0/i`)     | EVM checksum            | ✅         | Compatible with MetaMask             |
| Binance SC | BIP44 (`m/44'/60'/0'/0/i`)     | EVM checksum            | ✅         | Same as ETH                          |
| Dogecoin   | BIP44 (`m/44'/3'/0'/0/i`)      | Legacy P2PKH            | ✅         | No SegWit support                    |
| Litecoin   | BIP84 (`m/84'/2'/0'/0/i`)      | Bech32 P2WPKH           | ✅         | Modern SegWit                        |
| Tron       | BIP44 (`m/44'/195'/0'/0/i`)    | Base58Check TRX         | ✅         | Tron-specific encoding               |
| XRP        | BIP44 (`m/44'/144'/0'/0/i`)    | Ripple Base58           | ✅         | Classic XRPL address format         |
| Solana     | SLIP-0010 (`m/44'/501'/0'/0'`) | Ed25519 Pubkey (base58) | ❌         | Ed25519 curve, no BIP32 xpub        |

## Testnet Support

All chains support testnet address generation by setting `testnet: true` in the options:

| Chain      | Testnet Network | Address Format Changes                    |
| ---------- | --------------- | ---------------------------------------- |
| Bitcoin    | Testnet         | `tb1` prefix instead of `bc1`            |
| Ethereum   | Sepolia         | Same address format, different network   |
| Binance SC | BSC Testnet     | Same address format, different network   |
| Dogecoin   | Testnet         | Different address format                 |
| Litecoin   | Testnet         | `tltc` prefix instead of `ltc1`         |
| Tron       | Shasta          | Same address format, different API       |
| XRP        | Testnet         | Same address format, different network   |
| Solana     | Devnet          | Same address format, different network   |

## API Reference

### `mnemonicToSeed(mnemonic: string, passphrase?: string): Promise<Buffer>`

Converts a BIP-39 mnemonic to a seed buffer.

### `deriveAddressForChain(chain: Chain, seed: Buffer, opts?: DeriveOpts): DerivedAddress`

Derives an address for a specific blockchain.

#### Parameters

- `chain`: The blockchain to derive an address for
- `seed`: The seed buffer from `mnemonicToSeed`
- `opts`: Optional derivation parameters

#### DeriveOpts

```typescript
interface DeriveOpts {
  account?: number    // Account number (hardened, default: 0)
  change?: 0 | 1      // 0 = external, 1 = internal/change (default: 0)
  index?: number      // Address index (default: 0)
  customPath?: string // Override full derivation path (advanced)
  testnet?: boolean   // Use testnet instead of mainnet (default: false)
}
```

#### Return Value

```typescript
interface DerivedAddress {
  chain: Chain           // The blockchain identifier
  path: string          // The derivation path used
  address: string       // The blockchain address
  privateKeyHex?: string // Private key in hex (no 0x prefix)
  xpub?: string         // Extended public key (when applicable)
}
```

### `deriveXPubForChain(chain: Chain, seed: Buffer, opts?: DeriveOpts): XPubResult`

Derives an extended public key (xpub) for watch-only functionality.

#### Return Value

```typescript
interface XPubResult {
  chain: Chain                    // The blockchain identifier
  path: string                   // The derivation path used
  xpub: string                   // Extended public key (secure, no private keys)
  network: 'mainnet' | 'testnet' // Network type
}
```

**Note**: Solana is not supported for xpub derivation due to ed25519 curve limitations.

### `deriveWatchOnlyAddress(chain: Chain, xpub: string, change: 0|1, index: number, testnet?: boolean): WatchOnlyAddress`

Derives a watch-only address from an xpub without requiring private keys.

#### Parameters

- `chain`: The blockchain to derive an address for
- `xpub`: Extended public key from `deriveXPubForChain`
- `change`: 0 = external, 1 = internal/change
- `index`: Address index
- `testnet`: Use testnet (default: false)

#### Return Value

```typescript
interface WatchOnlyAddress {
  chain: Chain    // The blockchain identifier
  path: string   // The derivation path used
  address: string // The blockchain address
  xpub: string   // The xpub used for derivation
}
```

**Note**: Solana is not supported for watch-only derivation. Use `deriveAddressForChain` directly for Solana addresses.

## Development

```bash
# Install dependencies
npm install

# Run demo
npm run dev

# Build
npm run build

# Type check
npm run typecheck

# Run examples
npm run examples          # Basic usage
npm run examples:advanced # Advanced derivation
npm run examples:typescript # TypeScript example
npm run examples:testnet # Testnet usage
```

## Demo

Run `npm run dev` to see addresses derived for all supported chains from a randomly generated mnemonic.

## Security Notes

- **This SDK does NOT encrypt or secure your seed/mnemonic**
- **Keep your mnemonic secure and never share it**
- **This is for address derivation only - no transaction signing**
- **Use in production only with proper security measures**
- **Xpubs are secure for sharing - they contain no private keys**
- **Watch-only addresses are derived from public keys only**

## Roadmap

- [x] Watch-only address derivation from xpubs
- [x] TRX watch-only support (Keccak-256 address generation)
- [x] Comprehensive test coverage for xpub functionality
- [ ] Seed/xpriv encryption (AES-GCM + Argon2)
- [ ] Transaction signing support
- [ ] Balance queries via RPC
- [ ] More blockchain support
- [ ] Wallet backup/restore utilities

## License

MIT
# Repository Setup Complete
