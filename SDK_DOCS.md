# Multichain Seed SDK - Complete API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Core Concepts](#core-concepts)
4. [API Reference](#api-reference)
   - [mnemonicToSeed](#mnemonictoseed)
   - [deriveAddressForChain](#deriveaddressforchain)
   - [deriveXPubForChain](#derivexpubforchain)
   - [deriveWatchOnlyAddress](#derivewatchonlyaddress)
5. [Type Definitions](#type-definitions)
6. [Chain-Specific Details](#chain-specific-details)
7. [Examples](#examples)
8. [Best Practices](#best-practices)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Multichain Seed SDK is a TypeScript library for deriving deterministic blockchain addresses from a single BIP-39 mnemonic seed phrase across multiple blockchain networks. It follows BIP-32/BIP-44 standards and supports watch-only address derivation via extended public keys (xpubs).

### Key Features

- **Seed-only derivation**: No encryption or signing - purely deterministic address generation
- **Multi-chain support**: BTC, ETH, BSC, DOGE, LTC, TRX, XRP, SOL
- **BIP-39/BIP-32 compliant**: Standard HD wallet derivation paths
- **Watch-only addresses**: Derive addresses from xpubs without private keys
- **Testnet support**: Generate testnet addresses for development and testing
- **TypeScript**: Full type safety and IntelliSense support
- **Tree-shakable**: Import only what you need

### Supported Chains

| Chain | SLIP-44 | Purpose | Address Format | Watch-Only |
|-------|---------|---------|----------------|------------|
| Bitcoin (BTC) | 0 | 84 | Bech32 P2WPKH (`bc1...`) | ✅ |
| Ethereum (ETH) | 60 | 44 | EVM checksum (`0x...`) | ✅ |
| Binance Smart Chain (BSC) | 60 | 44 | EVM checksum (`0x...`) | ✅ |
| Dogecoin (DOGE) | 3 | 44 | Legacy P2PKH (`D...`) | ✅ |
| Litecoin (LTC) | 2 | 84 | Bech32 P2WPKH (`ltc1...`) | ✅ |
| Tron (TRX) | 195 | 44 | Base58Check TRX (`T...`) | ✅ |
| XRP Ledger (XRP) | 144 | 44 | Ripple Base58 (`r...`) | ✅ |
| Solana (SOL) | 501 | 44 | Ed25519 Pubkey (base58) | ❌ |

---

## Installation

```bash
npm install @nawab_kibria/multichain-sdk
```

### Requirements

- Node.js >= 20.0.0
- TypeScript (optional, for type definitions)

---

## Core Concepts

### Derivation Paths

The SDK uses BIP-44 hierarchical deterministic (HD) wallet paths:

```
m / purpose' / coin_type' / account' / change / address_index
```

- **purpose'**: Hardened purpose (44 for legacy, 49 for P2WPKH-in-P2SH, 84 for native SegWit)
- **coin_type'**: Hardened SLIP-44 coin type (see table above)
- **account'**: Hardened account number (default: 0)
- **change**: 0 = external/receiving, 1 = internal/change
- **address_index**: Sequential address index (default: 0)

**Example**: `m/84'/0'/0'/0/5` means:
- Purpose 84 (native SegWit)
- Coin type 0 (Bitcoin)
- Account 0
- Change 0 (external)
- Index 5

### Extended Public Keys (XPub)

An xpub is a public key that can derive child public keys without exposing private keys. This enables:
- **Watch-only wallets**: Monitor addresses without signing capability
- **Cold storage**: Keep seed offline, share xpub for monitoring
- **Multi-signature setups**: Share xpubs between parties

**Important**: Solana does not support xpub derivation because it uses ed25519 curve (not secp256k1) and SLIP-0010 derivation.

---

## API Reference

### mnemonicToSeed

Converts a BIP-39 mnemonic phrase to a seed buffer using PBKDF2.

```typescript
function mnemonicToSeed(
  mnemonic: string,
  passphrase?: string
): Promise<Buffer>
```

#### Parameters

- `mnemonic` (string): BIP-39 mnemonic phrase (12 or 24 words)
- `passphrase` (string, optional): Optional passphrase for additional entropy (default: empty string)

#### Returns

- `Promise<Buffer>`: 64-byte seed buffer

#### Example

```typescript
import { mnemonicToSeed } from '@nawab_kibria/multichain-sdk'

const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
const seed = await mnemonicToSeed(mnemonic)
console.log(seed.toString('hex')) // 64-byte hex string

// With passphrase
const seedWithPass = await mnemonicToSeed(mnemonic, "my passphrase")
```

#### Notes

- Uses PBKDF2 with 2048 iterations (BIP-39 standard)
- Returns a deterministic 64-byte buffer
- Passphrase adds additional entropy but must be remembered separately

---

### deriveAddressForChain

Derives a blockchain address and private key from a seed buffer.

```typescript
function deriveAddressForChain(
  chain: Chain,
  seed: Buffer,
  opts?: DeriveOpts
): DerivedAddress
```

#### Parameters

- `chain` (Chain): Blockchain identifier (`'BTC' | 'ETH' | 'BSC' | 'DOGE' | 'LTC' | 'TRX' | 'XRP' | 'SOL'`)
- `seed` (Buffer): Seed buffer from `mnemonicToSeed`
- `opts` (DeriveOpts, optional): Derivation options

#### DeriveOpts Interface

```typescript
interface DeriveOpts {
  /** Account number (hardened, default: 0) */
  account?: number
  
  /** 0 = external/receiving, 1 = internal/change (default: 0) */
  change?: 0 | 1
  
  /** Address index (default: 0) */
  index?: number
  
  /** Override full derivation path (advanced, use with caution) */
  customPath?: string
  
  /** Use testnet instead of mainnet (default: false) */
  testnet?: boolean
}
```

#### Returns

```typescript
interface DerivedAddress {
  /** The blockchain identifier */
  chain: Chain
  
  /** The derivation path used */
  path: string
  
  /** The blockchain address */
  address: string
  
  /** Private key in hex format (no 0x prefix, except Solana) */
  privateKeyHex?: string
  
  /** Array format private key for Solana (32-byte array) */
  privateKeyArray?: number[]
  
  /** Extended public key (when applicable, excludes Solana) */
  xpub?: string
}
```

#### Examples

**Basic Usage**

```typescript
import { mnemonicToSeed, deriveAddressForChain } from '@nawab_kibria/multichain-sdk'

const seed = await mnemonicToSeed("your mnemonic here")

// Derive first Bitcoin address
const btc = deriveAddressForChain('BTC', seed)
console.log(btc.address)  // bc1q...
console.log(btc.path)      // m/84'/0'/0'/0/0
console.log(btc.privateKeyHex) // hex private key

// Derive Ethereum address with custom index
const eth = deriveAddressForChain('ETH', seed, { index: 5 })
console.log(eth.address)  // 0x...
console.log(eth.path)      // m/44'/60'/0'/0/5
```

**Multiple Accounts**

```typescript
// Account 0, external addresses
const account0 = deriveAddressForChain('ETH', seed, { account: 0, change: 0, index: 0 })
const account1 = deriveAddressForChain('ETH', seed, { account: 1, change: 0, index: 0 })

// Account 0, change addresses (internal)
const change0 = deriveAddressForChain('BTC', seed, { account: 0, change: 1, index: 0 })
```

**Testnet Addresses**

```typescript
// Bitcoin testnet
const btcTestnet = deriveAddressForChain('BTC', seed, { testnet: true })
console.log(btcTestnet.address) // tb1q... (testnet prefix)

// Ethereum Sepolia testnet
const ethTestnet = deriveAddressForChain('ETH', seed, { testnet: true, index: 0 })
// Address format is same, but network is Sepolia
```

**Solana (Special Case)**

```typescript
// Solana uses account-level derivation (m/44'/501'/account')
const sol = deriveAddressForChain('SOL', seed, { account: 0, index: 0 })
console.log(sol.address)  // Base58 Solana address
console.log(sol.path)      // m/44'/501'/0'
console.log(sol.privateKeyHex) // 64 hex chars (32 bytes)
console.log(sol.privateKeyArray) // [32-byte array] for Keypair.fromSecretKey()
```

**Custom Path (Advanced)**

```typescript
// Override default path (use with caution)
const custom = deriveAddressForChain('BTC', seed, { 
  customPath: "m/84'/0'/0'/0/10" 
})
```

#### Chain-Specific Behavior

- **BTC/LTC**: Uses BIP84 (native SegWit) by default
- **DOGE**: Uses BIP44 (legacy P2PKH) - no SegWit support
- **ETH/BSC**: Same derivation path (both use coin type 60)
- **SOL**: Uses account-level derivation only (no change/index in path)

---

### deriveXPubForChain

Derives an extended public key (xpub) for watch-only functionality. The xpub can be shared safely as it contains no private keys.

```typescript
function deriveXPubForChain(
  chain: Chain,
  seed: Buffer,
  opts?: DeriveOpts
): XPubResult
```

#### Parameters

- `chain` (Chain): Blockchain identifier (excludes `'SOL'` - not supported)
- `seed` (Buffer): Seed buffer from `mnemonicToSeed`
- `opts` (DeriveOpts, optional): Derivation options (account, change, index, testnet)

#### Returns

```typescript
interface XPubResult {
  /** The blockchain identifier */
  chain: Chain
  
  /** The derivation path used */
  path: string
  
  /** Extended public key (base58 encoded, no private keys) */
  xpub: string
  
  /** Network type */
  network: 'mainnet' | 'testnet'
}
```

#### Examples

**Basic XPub Derivation**

```typescript
import { mnemonicToSeed, deriveXPubForChain } from '@nawab_kibria/multichain-sdk'

const seed = await mnemonicToSeed("your mnemonic here")

// Derive xpub for Bitcoin account 0
const btcXpub = deriveXPubForChain('BTC', seed, { account: 0 })
console.log(btcXpub.xpub)    // xpub6...
console.log(btcXpub.path)    // m/84'/0'/0'/0/0
console.log(btcXpub.network) // mainnet

// Derive xpub for Ethereum account 0
const ethXpub = deriveXPubForChain('ETH', seed, { account: 0 })
console.log(ethXpub.xpub)    // xpub6...
```

**Testnet XPub**

```typescript
// Testnet xpub has different format
const btcTestnetXpub = deriveXPubForChain('BTC', seed, { 
  account: 0, 
  testnet: true 
})
console.log(btcTestnetXpub.network) // testnet
console.log(btcTestnetXpub.xpub)    // tpub... (testnet prefix)
```

**Multiple Accounts**

```typescript
// Account 0
const xpub0 = deriveXPubForChain('ETH', seed, { account: 0 })

// Account 1
const xpub1 = deriveXPubForChain('ETH', seed, { account: 1 })

// These xpubs derive different address spaces
```

#### Error Handling

```typescript
try {
  const solXpub = deriveXPubForChain('SOL', seed)
} catch (error) {
  console.error(error.message) 
  // "Solana does not support xpub derivation (uses ed25519)"
}
```

#### Notes

- XPub is derived at the parent of the last index (account/change level)
- XPub format is chain-specific (BTC uses different encoding than ETH)
- Testnet and mainnet xpubs are incompatible (different network bytes)
- XPub can be shared safely - it contains no private keys
- Solana is not supported (uses ed25519, not secp256k1)

---

### deriveWatchOnlyAddress

Derives a watch-only address from an extended public key (xpub) without requiring the seed or private keys.

```typescript
function deriveWatchOnlyAddress(
  chain: Chain,
  xpub: string,
  change: 0 | 1,
  index: number,
  testnet?: boolean
): WatchOnlyAddress
```

#### Parameters

- `chain` (Chain): Blockchain identifier (excludes `'SOL'` - not supported)
- `xpub` (string): Extended public key from `deriveXPubForChain`
- `change` (0 | 1): 0 = external/receiving, 1 = internal/change
- `index` (number): Address index
- `testnet` (boolean, optional): Whether xpub is for testnet (default: false)

#### Returns

```typescript
interface WatchOnlyAddress {
  /** The blockchain identifier */
  chain: Chain
  
  /** The derivation path used */
  path: string
  
  /** The blockchain address */
  address: string
  
  /** The xpub used for derivation */
  xpub: string
}
```

#### Examples

**Basic Watch-Only Derivation**

```typescript
import { 
  mnemonicToSeed, 
  deriveXPubForChain, 
  deriveWatchOnlyAddress 
} from '@nawab_kibria/multichain-sdk'

const seed = await mnemonicToSeed("your mnemonic here")

// Step 1: Derive xpub (one-time, can be done offline)
const xpubResult = deriveXPubForChain('ETH', seed, { account: 0 })

// Step 2: Derive addresses from xpub (no seed needed)
const addr0 = deriveWatchOnlyAddress('ETH', xpubResult.xpub, 0, 0)
const addr1 = deriveWatchOnlyAddress('ETH', xpubResult.xpub, 0, 1)
const addr2 = deriveWatchOnlyAddress('ETH', xpubResult.xpub, 0, 2)

console.log(addr0.address) // 0x...
console.log(addr1.address) // 0x...
console.log(addr2.address) // 0x...
```

**Verify Match with Direct Derivation**

```typescript
const seed = await mnemonicToSeed("your mnemonic here")

// Direct derivation (requires seed)
const direct = deriveAddressForChain('ETH', seed, { 
  account: 0, 
  change: 0, 
  index: 0 
})

// Watch-only derivation (no seed needed)
const xpub = deriveXPubForChain('ETH', seed, { account: 0 })
const watchOnly = deriveWatchOnlyAddress('ETH', xpub.xpub, 0, 0)

console.log(direct.address === watchOnly.address) // true ✅
```

**Change Addresses**

```typescript
const xpub = deriveXPubForChain('BTC', seed, { account: 0 })

// External addresses (change = 0)
const external0 = deriveWatchOnlyAddress('BTC', xpub.xpub, 0, 0)
const external1 = deriveWatchOnlyAddress('BTC', xpub.xpub, 0, 1)

// Internal/change addresses (change = 1)
const internal0 = deriveWatchOnlyAddress('BTC', xpub.xpub, 1, 0)
const internal1 = deriveWatchOnlyAddress('BTC', xpub.xpub, 1, 1)
```

**Testnet Watch-Only**

```typescript
const testnetXpub = deriveXPubForChain('BTC', seed, { 
  account: 0, 
  testnet: true 
})

const testnetAddr = deriveWatchOnlyAddress(
  'BTC', 
  testnetXpub.xpub, 
  0, 
  0, 
  true // testnet flag
)

console.log(testnetAddr.address) // tb1q... (testnet)
```

**Batch Address Generation**

```typescript
// Generate first 10 addresses without seed
function generateAddresses(xpub: string, count: number) {
  const addresses = []
  for (let i = 0; i < count; i++) {
    const addr = deriveWatchOnlyAddress('ETH', xpub, 0, i)
    addresses.push(addr.address)
  }
  return addresses
}

const xpub = deriveXPubForChain('ETH', seed, { account: 0 })
const addresses = generateAddresses(xpub.xpub, 10)
console.log(addresses) // Array of 10 addresses
```

#### Error Handling

```typescript
try {
  const solWatchOnly = deriveWatchOnlyAddress('SOL', xpub, 0, 0)
} catch (error) {
  console.error(error.message) 
  // "Solana does not support watch-only derivation (uses ed25519)"
}
```

#### Notes

- XPub must match the chain and network (testnet/mainnet)
- XPub is already at the account/change level, so only index is derived
- Watch-only addresses match direct derivation exactly
- No private keys are exposed or required
- Perfect for monitoring wallets without signing capability
- Solana is not supported (uses ed25519, not BIP32)

---

## Type Definitions

### Chain

```typescript
type Chain =
  | 'BTC'
  | 'ETH'
  | 'BSC'
  | 'DOGE'
  | 'LTC'
  | 'TRX'
  | 'XRP'
  | 'SOL'
```

### DeriveOpts

```typescript
interface DeriveOpts {
  /** Account number (hardened, default: 0) */
  account?: number
  
  /** 0 = external/receiving, 1 = internal/change (default: 0) */
  change?: 0 | 1
  
  /** Address index (default: 0) */
  index?: number
  
  /** Override full derivation path (advanced) */
  customPath?: string
  
  /** Use testnet instead of mainnet (default: false) */
  testnet?: boolean
}
```

### DerivedAddress

```typescript
interface DerivedAddress {
  /** The blockchain identifier */
  chain: Chain
  
  /** The derivation path used */
  path: string
  
  /** The blockchain address */
  address: string
  
  /** Private key in hex format (no 0x prefix, except Solana) */
  privateKeyHex?: string
  
  /** Array format private key for Solana (32-byte array) */
  privateKeyArray?: number[]
  
  /** Extended public key (when applicable, excludes Solana) */
  xpub?: string
}
```

### XPubResult

```typescript
interface XPubResult {
  /** The blockchain identifier */
  chain: Chain
  
  /** The derivation path used */
  path: string
  
  /** Extended public key (base58 encoded, no private keys) */
  xpub: string
  
  /** Network type */
  network: 'mainnet' | 'testnet'
}
```

### WatchOnlyAddress

```typescript
interface WatchOnlyAddress {
  /** The blockchain identifier */
  chain: Chain
  
  /** The derivation path used */
  path: string
  
  /** The blockchain address */
  address: string
  
  /** The xpub used for derivation */
  xpub: string
}
```

---

## Chain-Specific Details

### Bitcoin (BTC)

- **Purpose**: 84 (BIP84 - native SegWit)
- **Coin Type**: 0
- **Address Format**: Bech32 P2WPKH (`bc1q...` for mainnet, `tb1q...` for testnet)
- **Derivation Path**: `m/84'/0'/account'/change/index`
- **XPub Support**: ✅ Yes
- **Watch-Only**: ✅ Yes

**Example**:
```typescript
const btc = deriveAddressForChain('BTC', seed, { account: 0, index: 0 })
// Path: m/84'/0'/0'/0/0
// Address: bc1q...
```

### Ethereum (ETH)

- **Purpose**: 44 (BIP44)
- **Coin Type**: 60
- **Address Format**: EVM checksum address (`0x...` with EIP-55 checksum)
- **Derivation Path**: `m/44'/60'/account'/change/index`
- **XPub Support**: ✅ Yes
- **Watch-Only**: ✅ Yes

**Example**:
```typescript
const eth = deriveAddressForChain('ETH', seed, { account: 0, index: 0 })
// Path: m/44'/60'/0'/0/0
// Address: 0x... (checksummed)
```

### Binance Smart Chain (BSC)

- **Purpose**: 44 (BIP44)
- **Coin Type**: 60 (same as ETH)
- **Address Format**: EVM checksum address (`0x...` with EIP-55 checksum)
- **Derivation Path**: `m/44'/60'/account'/change/index`
- **XPub Support**: ✅ Yes
- **Watch-Only**: ✅ Yes

**Note**: BSC uses the same derivation as ETH (coin type 60), so addresses are compatible with Ethereum tooling.

**Example**:
```typescript
const bsc = deriveAddressForChain('BSC', seed, { account: 0, index: 0 })
// Path: m/44'/60'/0'/0/0
// Address: 0x... (same format as ETH)
```

### Dogecoin (DOGE)

- **Purpose**: 44 (BIP44 - legacy)
- **Coin Type**: 3
- **Address Format**: Legacy P2PKH (`D...` for mainnet)
- **Derivation Path**: `m/44'/3'/account'/change/index`
- **XPub Support**: ✅ Yes
- **Watch-Only**: ✅ Yes

**Note**: Dogecoin does not support SegWit, so it uses legacy P2PKH addresses.

**Example**:
```typescript
const doge = deriveAddressForChain('DOGE', seed, { account: 0, index: 0 })
// Path: m/44'/3'/0'/0/0
// Address: D...
```

### Litecoin (LTC)

- **Purpose**: 84 (BIP84 - native SegWit)
- **Coin Type**: 2
- **Address Format**: Bech32 P2WPKH (`ltc1...` for mainnet, `tltc1...` for testnet)
- **Derivation Path**: `m/84'/2'/account'/change/index`
- **XPub Support**: ✅ Yes
- **Watch-Only**: ✅ Yes

**Example**:
```typescript
const ltc = deriveAddressForChain('LTC', seed, { account: 0, index: 0 })
// Path: m/84'/2'/0'/0/0
// Address: ltc1q...
```

### Tron (TRX)

- **Purpose**: 44 (BIP44)
- **Coin Type**: 195
- **Address Format**: Base58Check TRX address (`T...` for mainnet)
- **Derivation Path**: `m/44'/195'/account'/change/index`
- **XPub Support**: ✅ Yes
- **Watch-Only**: ✅ Yes

**Note**: Tron addresses are derived from Keccak-256 hash of the public key, then Base58Check encoded with prefix `0x41`.

**Example**:
```typescript
const trx = deriveAddressForChain('TRX', seed, { account: 0, index: 0 })
// Path: m/44'/195'/0'/0/0
// Address: T...
```

### XRP Ledger (XRP)

- **Purpose**: 44 (BIP44)
- **Coin Type**: 144
- **Address Format**: Ripple Base58 (`r...` for mainnet)
- **Derivation Path**: `m/44'/144'/account'/change/index`
- **XPub Support**: ✅ Yes
- **Watch-Only**: ✅ Yes

**Note**: XRP addresses are derived from RIPEMD160(SHA256(public key)), then encoded using Ripple's address codec.

**Example**:
```typescript
const xrp = deriveAddressForChain('XRP', seed, { account: 0, index: 0 })
// Path: m/44'/144'/0'/0/0
// Address: r...
```

### Solana (SOL)

- **Purpose**: 44 (SLIP-0010)
- **Coin Type**: 501
- **Address Format**: Ed25519 public key (base58 encoded)
- **Derivation Path**: `m/44'/501'/account'` (account-level only, no change/index)
- **XPub Support**: ❌ No (uses ed25519, not secp256k1)
- **Watch-Only**: ❌ No (use `deriveAddressForChain` directly)

**Note**: Solana uses ed25519 curve and SLIP-0010 derivation. The SDK uses Trust Wallet style derivation where the account number increments for different addresses. The `index` option is used to calculate the account number (`account + index`).

**Example**:
```typescript
const sol = deriveAddressForChain('SOL', seed, { account: 0, index: 0 })
// Path: m/44'/501'/0'
// Address: Base58 Solana address
// privateKeyHex: 64 hex chars (32 bytes)
// privateKeyArray: [32-byte array] for Keypair.fromSecretKey()
```

---

## Examples

### Complete Workflow

```typescript
import { 
  mnemonicToSeed, 
  deriveAddressForChain,
  deriveXPubForChain,
  deriveWatchOnlyAddress 
} from '@nawab_kibria/multichain-sdk'

async function completeExample() {
  // 1. Convert mnemonic to seed
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
  const seed = await mnemonicToSeed(mnemonic)
  
  // 2. Derive addresses for all chains
  const chains = ['BTC', 'ETH', 'BSC', 'DOGE', 'LTC', 'TRX', 'XRP', 'SOL']
  
  for (const chain of chains) {
    const address = deriveAddressForChain(chain, seed, { index: 0 })
    console.log(`${chain}: ${address.address}`)
    console.log(`  Path: ${address.path}`)
    if (address.xpub) {
      console.log(`  XPub: ${address.xpub}`)
    }
  }
  
  // 3. Derive xpub for watch-only functionality
  const ethXpub = deriveXPubForChain('ETH', seed, { account: 0 })
  console.log(`\nETH XPub: ${ethXpub.xpub}`)
  
  // 4. Generate watch-only addresses
  for (let i = 0; i < 5; i++) {
    const watchOnly = deriveWatchOnlyAddress('ETH', ethXpub.xpub, 0, i)
    console.log(`Watch-only ${i}: ${watchOnly.address}`)
  }
}

completeExample().catch(console.error)
```

### Multi-Account Wallet

```typescript
import { mnemonicToSeed, deriveAddressForChain } from '@nawab_kibria/multichain-sdk'

async function multiAccountExample() {
  const seed = await mnemonicToSeed("your mnemonic here")
  
  // Account 0: Personal
  const personalBTC = deriveAddressForChain('BTC', seed, { account: 0, index: 0 })
  const personalETH = deriveAddressForChain('ETH', seed, { account: 0, index: 0 })
  
  // Account 1: Business
  const businessBTC = deriveAddressForChain('BTC', seed, { account: 1, index: 0 })
  const businessETH = deriveAddressForChain('ETH', seed, { account: 1, index: 0 })
  
  console.log('Personal:', {
    BTC: personalBTC.address,
    ETH: personalETH.address
  })
  
  console.log('Business:', {
    BTC: businessBTC.address,
    ETH: businessETH.address
  })
}

multiAccountExample().catch(console.error)
```

### Cold Storage + Hot Monitoring

```typescript
import { 
  mnemonicToSeed, 
  deriveXPubForChain,
  deriveWatchOnlyAddress 
} from '@nawab_kibria/multichain-sdk'

async function coldStorageExample() {
  // Step 1: Generate xpub offline (cold storage)
  const seed = await mnemonicToSeed("your mnemonic here")
  const xpub = deriveXPubForChain('BTC', seed, { account: 0 })
  
  // Step 2: Share xpub with hot monitoring service (safe - no private keys)
  console.log('Share this xpub with monitoring service:', xpub.xpub)
  
  // Step 3: Monitoring service derives addresses without seed
  function monitorWallet(xpub: string) {
    const addresses = []
    for (let i = 0; i < 10; i++) {
      const addr = deriveWatchOnlyAddress('BTC', xpub, 0, i)
      addresses.push(addr.address)
    }
    return addresses
  }
  
  const monitoredAddresses = monitorWallet(xpub.xpub)
  console.log('Monitored addresses:', monitoredAddresses)
  
  // Seed remains secure offline, monitoring works without it
}

coldStorageExample().catch(console.error)
```

### Testnet Development

```typescript
import { mnemonicToSeed, deriveAddressForChain } from '@nawab_kibria/multichain-sdk'

async function testnetExample() {
  const seed = await mnemonicToSeed("test mnemonic for development")
  
  // Generate testnet addresses
  const btcTestnet = deriveAddressForChain('BTC', seed, { 
    testnet: true, 
    index: 0 
  })
  console.log('BTC Testnet:', btcTestnet.address) // tb1q...
  
  const ethTestnet = deriveAddressForChain('ETH', seed, { 
    testnet: true, 
    index: 0 
  })
  console.log('ETH Sepolia:', ethTestnet.address) // 0x... (Sepolia network)
  
  const trxTestnet = deriveAddressForChain('TRX', seed, { 
    testnet: true, 
    index: 0 
  })
  console.log('TRX Shasta:', trxTestnet.address) // T... (Shasta testnet)
}

testnetExample().catch(console.error)
```

---

## Best Practices

### 1. Seed Security

- **Never commit seeds/mnemonics to version control**
- **Use environment variables or secure key management**
- **Store seeds offline (cold storage) when possible**
- **Use passphrases for additional security**

```typescript
// ❌ BAD: Hardcoded mnemonic
const seed = await mnemonicToSeed("abandon abandon...")

// ✅ GOOD: From environment
const mnemonic = process.env.MNEMONIC!
const seed = await mnemonicToSeed(mnemonic)

// ✅ BETTER: With passphrase
const seed = await mnemonicToSeed(mnemonic, process.env.PASSPHRASE)
```

### 2. Account Management

- **Use separate accounts for different purposes** (personal, business, etc.)
- **Use account 0 for primary wallet**
- **Increment accounts for organizational separation**

```typescript
// Personal wallet
const personal = deriveAddressForChain('ETH', seed, { account: 0 })

// Business wallet
const business = deriveAddressForChain('ETH', seed, { account: 1 })

// Savings wallet
const savings = deriveAddressForChain('ETH', seed, { account: 2 })
```

### 3. Change Addresses

- **Use change = 0 for receiving addresses** (external)
- **Use change = 1 for change addresses** (internal, UTXO chains)
- **EVM chains (ETH/BSC) typically use change = 0 only**

```typescript
// Receiving address
const receiving = deriveAddressForChain('BTC', seed, { change: 0, index: 0 })

// Change address (UTXO chains)
const change = deriveAddressForChain('BTC', seed, { change: 1, index: 0 })
```

### 4. Watch-Only Workflows

- **Derive xpub once, store securely**
- **Share xpub with monitoring services (safe - no private keys)**
- **Keep seed offline, use xpub for hot monitoring**

```typescript
// One-time: Derive xpub (do this offline)
const xpub = deriveXPubForChain('ETH', seed, { account: 0 })

// Store xpub securely (can be shared)
const xpubString = xpub.xpub

// Later: Generate addresses without seed
const addr = deriveWatchOnlyAddress('ETH', xpubString, 0, 0)
```

### 5. Error Handling

- **Always handle errors gracefully**
- **Validate inputs before derivation**
- **Check for Solana limitations**

```typescript
try {
  const address = deriveAddressForChain('SOL', seed)
  // Solana works
} catch (error) {
  console.error('Solana derivation failed:', error.message)
}

try {
  const xpub = deriveXPubForChain('SOL', seed)
} catch (error) {
  // Expected: Solana doesn't support xpub
  console.error('XPub not supported:', error.message)
}
```

### 6. Type Safety

- **Use TypeScript for type safety**
- **Import types explicitly when needed**
- **Leverage IntelliSense for autocomplete**

```typescript
import type { Chain, DerivedAddress, DeriveOpts } from '@nawab_kibria/multichain-sdk'

function deriveAddress(chain: Chain, seed: Buffer, opts?: DeriveOpts): DerivedAddress {
  return deriveAddressForChain(chain, seed, opts)
}
```

---

## Security Considerations

### ⚠️ Important Warnings

1. **This SDK does NOT encrypt or secure your seed/mnemonic**
   - Seeds are stored in memory as plain buffers
   - No encryption is applied
   - Use proper key management in production

2. **Keep your mnemonic secure**
   - Never share your mnemonic
   - Never commit it to version control
   - Use secure storage (hardware wallets, encrypted vaults)

3. **This is for address derivation only**
   - No transaction signing capability
   - No balance queries
   - No network communication

4. **XPub security**
   - XPubs are safe to share (no private keys)
   - However, they reveal all public keys in the account
   - Use separate accounts for different purposes

5. **Testnet vs Mainnet**
   - Testnet and mainnet addresses are different
   - Testnet xpubs are incompatible with mainnet
   - Always verify network before operations

### Security Best Practices

1. **Use passphrases** for additional entropy
2. **Store seeds offline** (cold storage)
3. **Use hardware wallets** for production
4. **Implement proper key management** (HSM, KMS, etc.)
5. **Audit dependencies** regularly
6. **Use testnet** for development and testing

---

## Troubleshooting

### Common Issues

#### 1. "Invalid mnemonic"

**Problem**: Mnemonic phrase is invalid or malformed.

**Solution**: Ensure mnemonic is valid BIP-39 (12 or 24 words, valid word list).

```typescript
// Check mnemonic validity
import { validateMnemonic } from 'bip39' // if available
if (!validateMnemonic(mnemonic)) {
  throw new Error('Invalid mnemonic')
}
```

#### 2. "Solana does not support xpub derivation"

**Problem**: Attempting to derive xpub for Solana.

**Solution**: Solana uses ed25519 curve, not secp256k1, so xpub is not supported. Use `deriveAddressForChain` directly.

```typescript
// ❌ Won't work
const solXpub = deriveXPubForChain('SOL', seed)

// ✅ Correct approach
const solAddress = deriveAddressForChain('SOL', seed)
```

#### 3. Address mismatch between direct and watch-only

**Problem**: Addresses derived directly don't match watch-only addresses.

**Solution**: Ensure xpub matches the exact account, change, and network used in direct derivation.

```typescript
// Ensure same parameters
const direct = deriveAddressForChain('ETH', seed, { account: 0, change: 0, index: 0 })
const xpub = deriveXPubForChain('ETH', seed, { account: 0, change: 0, index: 0 })
const watchOnly = deriveWatchOnlyAddress('ETH', xpub.xpub, 0, 0)

// Should match
console.log(direct.address === watchOnly.address) // true
```

#### 4. Testnet address format issues

**Problem**: Testnet addresses don't match expected format.

**Solution**: Ensure `testnet: true` is set consistently for both xpub and watch-only derivation.

```typescript
// Both must use testnet
const xpub = deriveXPubForChain('BTC', seed, { testnet: true })
const addr = deriveWatchOnlyAddress('BTC', xpub.xpub, 0, 0, true)
```

#### 5. Invalid derivation path

**Problem**: Custom path causes errors.

**Solution**: Ensure custom path follows BIP-44 format and uses correct coin types.

```typescript
// ✅ Valid
const opts = { customPath: "m/44'/60'/0'/0/0" }

// ❌ Invalid (missing hardened markers)
const opts = { customPath: "m/44/60/0/0/0" }
```

### Getting Help

- **Check examples**: See `examples/` directory for working code
- **Review tests**: See `tests/` directory for edge cases
- **Open an issue**: GitHub issues for bugs or questions
- **Read BIP standards**: BIP-32, BIP-39, BIP-44 for derivation details

---

## License

MIT

---

## Version

This documentation is for SDK version **0.2.0**.

For the latest updates, check the [GitHub repository](https://github.com/nawab69/multichain-sdk).

