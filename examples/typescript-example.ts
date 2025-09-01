/**
 * TypeScript Example for Multichain Seed SDK
 * 
 * This example demonstrates:
 * 1. Type safety with TypeScript
 * 2. Advanced type usage
 * 3. Error handling with proper types
 * 4. Building reusable functions
 */

import { mnemonicToSeed, deriveAddressForChain } from '../dist/index.js'
import type { Chain, DeriveOpts, DerivedAddress } from '../dist/index.js'

// Type-safe chain configuration
interface ChainConfig {
  chain: Chain
  name: string
  description: string
  defaultPurpose: number
}

const CHAIN_CONFIGS: Record<Chain, ChainConfig> = {
  BTC: {
    chain: 'BTC',
    name: 'Bitcoin',
    description: 'BIP84 bech32 P2WPKH',
    defaultPurpose: 84
  },
  ETH: {
    chain: 'ETH',
    name: 'Ethereum',
    description: 'BIP44 EVM checksum',
    defaultPurpose: 44
  },
  BSC: {
    chain: 'BSC',
    name: 'Binance Smart Chain',
    description: 'Same as ETH (EVM)',
    defaultPurpose: 44
  },
  DOGE: {
    chain: 'DOGE',
    name: 'Dogecoin',
    description: 'BIP44 legacy P2PKH',
    defaultPurpose: 44
  },
  LTC: {
    chain: 'LTC',
    name: 'Litecoin',
    description: 'BIP84 bech32 P2WPKH',
    defaultPurpose: 84
  },
  TRX: {
    chain: 'TRX',
    name: 'Tron',
    description: 'BIP44 Base58Check',
    defaultPurpose: 44
  },
  XRP: {
    chain: 'XRP',
    name: 'Ripple',
    description: 'BIP44 Ripple Base58',
    defaultPurpose: 44
  },
  SOL: {
    chain: 'SOL',
    name: 'Solana',
    description: 'SLIP-0010 Ed25519',
    defaultPurpose: 44
  }
}

// Type-safe address generation function
async function generateAddressesForChain(
  seed: Buffer,
  chain: Chain,
  options: DeriveOpts[] = [{ index: 0 }]
): Promise<DerivedAddress[]> {
  return options.map(opt => deriveAddressForChain(chain, seed, opt))
}

// Type-safe batch generation
async function generateBatchAddresses(
  seed: Buffer,
  chains: Chain[],
  options: DeriveOpts[] = [{ index: 0 }]
): Promise<Record<Chain, DerivedAddress[]>> {
  const result: Record<Chain, DerivedAddress[]> = {} as Record<Chain, DerivedAddress[]>
  
  for (const chain of chains) {
    result[chain] = await generateAddressesForChain(seed, chain, options)
  }
  
  return result
}

// Type-safe validation function
function validateAddress(address: DerivedAddress): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!address.address) {
    errors.push('Address is missing')
  }
  
  if (!address.path) {
    errors.push('Derivation path is missing')
  }
  
  if (!address.privateKeyHex) {
    errors.push('Private key is missing')
  }
  
  // Chain-specific validation
  switch (address.chain) {
    case 'BTC':
    case 'LTC':
      if (!address.address.startsWith('bc1') && !address.address.startsWith('ltc1')) {
        errors.push(`Invalid ${address.chain} address format`)
      }
      break
    case 'ETH':
    case 'BSC':
      if (!address.address.startsWith('0x')) {
        errors.push(`Invalid ${address.chain} address format`)
      }
      break
    case 'SOL':
      if (address.privateKeyHex.length !== 64) {
        errors.push('Invalid Solana private key length (should be 64 hex chars)')
      }
      break
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Main example function
async function typescriptExample() {
  console.log('🚀 Multichain Seed SDK - TypeScript Example\n')
  
  try {
    // Example mnemonic
    const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
    const seed = await mnemonicToSeed(mnemonic)
    
    console.log('📝 Mnemonic:', mnemonic)
    console.log('🌱 Seed length:', seed.length, 'bytes')
    console.log('')
    
    // Example 1: Type-safe single chain generation
    console.log('🔐 Example 1: Type-safe Single Chain Generation')
    console.log('===============================================')
    
    const btcAddresses = await generateAddressesForChain(seed, 'BTC', [
      { index: 0 },
      { index: 1 },
      { index: 2 }
    ])
    
    btcAddresses.forEach((address, i) => {
      const validation = validateAddress(address)
      console.log(`BTC Index ${i}: ${address.address}`)
      console.log(`  Path: ${address.path}`)
      console.log(`  Valid: ${validation.isValid ? '✅' : '❌'}`)
      if (!validation.isValid) {
        console.log(`  Errors: ${validation.errors.join(', ')}`)
      }
      console.log('')
    })
    
    // Example 2: Batch generation with type safety
    console.log('🔐 Example 2: Batch Generation with Type Safety')
    console.log('===============================================')
    
    const selectedChains: Chain[] = ['ETH', 'SOL', 'DOGE']
    const batchResult = await generateBatchAddresses(seed, selectedChains, [
      { index: 0 },
      { account: 1, index: 0 }
    ])
    
    for (const [chain, addresses] of Object.entries(batchResult)) {
      console.log(`${chain}:`)
      addresses.forEach((address, i) => {
        console.log(`  ${i === 0 ? 'Index 0' : 'Account 1'}: ${address.address}`)
        console.log(`  Path: ${address.path}`)
      })
      console.log('')
    }
    
    // Example 3: Advanced type usage
    console.log('🔐 Example 3: Advanced Type Usage')
    console.log('=================================')
    
    const chainInfo = Object.values(CHAIN_CONFIGS).map(config => ({
      ...config,
      sampleAddress: deriveAddressForChain(config.chain, seed, { index: 42 })
    }))
    
    chainInfo.forEach(info => {
      console.log(`${info.name.padEnd(15)} (${info.chain})`)
      console.log(`  Purpose: ${info.defaultPurpose}'`)
      console.log(`  Description: ${info.description}`)
      console.log(`  Sample Address: ${info.sampleAddress.address}`)
      console.log('')
    })
    
    // Example 4: Error handling with types
    console.log('🔐 Example 4: Error Handling with Types')
    console.log('========================================')
    
    const allAddresses = await generateBatchAddresses(seed, Object.keys(CHAIN_CONFIGS) as Chain[])
    const validationResults = Object.entries(allAddresses).map(([chain, addresses]) => ({
      chain,
      addresses: addresses.map(addr => validateAddress(addr))
    }))
    
    validationResults.forEach(({ chain, addresses }) => {
      const validCount = addresses.filter(v => v.isValid).length
      const totalCount = addresses.length
      console.log(`${chain.padEnd(4)}: ${validCount}/${totalCount} addresses valid`)
    })
    
    console.log('\n✅ TypeScript example completed successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

// Run the example
typescriptExample().catch(console.error)
