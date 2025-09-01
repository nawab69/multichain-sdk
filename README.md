# Multichain Seed SDK

A TypeScript SDK for deriving deterministic blockchain addresses from a single BIP-39 mnemonic/seed across multiple chains.

## Features

- **Seed-only**: No encryption or signing - purely address derivation
- **Multi-chain support**: BTC, ETH, BSC, DOGE, LTC, TRX, XRP, SOL
- **BIP-39/BIP-32 compliant**: Standard HD wallet derivation paths
- **Tree-shakable**: Only import what you need
- **TypeScript**: Full type safety and IntelliSense

## Installation

```bash
npm install multichain-seed-sdk
```

## Quick Start

```typescript
import { mnemonicToSeed, deriveAddressForChain } from 'multichain-seed-sdk'

const mnemonic = "your twelve or twenty four words here"
const seed = await mnemonicToSeed(mnemonic)

// Derive addresses for different chains
const eth0 = deriveAddressForChain('ETH', seed, { index: 0 })
const btc5 = deriveAddressForChain('BTC', seed, { index: 5 })
const sol0 = deriveAddressForChain('SOL', seed) // uses m/44'/501'/0'/0' by default

console.log(eth0.address, eth0.path) // 0x...
console.log(btc5.address, btc5.path) // bc1...
console.log(sol0.address, sol0.path) // 1111... (base58)
```

## Supported Chains

| Chain      | Derivation                     | Address Type            | Notes                                |
| ---------- | ------------------------------ | ----------------------- | ------------------------------------ |
| Bitcoin    | BIP84 (`m/84'/0'/0'/0/i`)      | Bech32 P2WPKH           | Modern SegWit                        |
| Ethereum   | BIP44 (`m/44'/60'/0'/0/i`)     | EVM checksum            | Compatible with MetaMask             |
| Binance SC | BIP44 (`m/44'/60'/0'/0/i`)     | EVM checksum            | Same as ETH                          |
| Dogecoin   | BIP44 (`m/44'/3'/0'/0/i`)      | Legacy P2PKH            | No SegWit support                    |
| Litecoin   | BIP84 (`m/84'/2'/0'/0/i`)      | Bech32 P2WPKH           | Modern SegWit                        |
| Tron       | BIP44 (`m/44'/195'/0'/0/i`)    | Base58Check TRX         | Tron-specific encoding               |
| XRP        | BIP44 (`m/44'/144'/0'/0/i`)    | Ripple Base58           | Classic XRPL address format         |
| Solana     | SLIP-0010 (`m/44'/501'/0'/0'`) | Ed25519 Pubkey (base58) | Ed25519 curve, no BIP32 xpub        |

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
```

## Demo

Run `npm run dev` to see addresses derived for all supported chains from a randomly generated mnemonic.

## Security Notes

- **This SDK does NOT encrypt or secure your seed/mnemonic**
- **Keep your mnemonic secure and never share it**
- **This is for address derivation only - no transaction signing**
- **Use in production only with proper security measures**

## Roadmap

- [ ] Seed/xpriv encryption (AES-GCM + Argon2)
- [ ] Transaction signing support
- [ ] Balance queries via RPC
- [ ] More blockchain support
- [ ] Wallet backup/restore utilities

## License

MIT
