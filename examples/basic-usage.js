#!/usr/bin/env node

/**
 * Basic Usage Example for Multichain Seed SDK
 * 
 * This example shows how to:
 * 1. Convert a mnemonic to seed
 * 2. Derive addresses for different chains
 * 3. Handle different derivation parameters
 */

import { mnemonicToSeed, deriveAddressForChain } from '../dist/index.js'

async function basicExample() {
  console.log('🚀 Multichain Seed SDK - Basic Usage Example\n')
  
  // Example mnemonic (12 words for demo purposes)
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
  
  console.log('📝 Mnemonic:', mnemonic)
  console.log('')
  
  try {
    // Convert mnemonic to seed
    const seed = await mnemonicToSeed(mnemonic)
    console.log('🌱 Seed (hex):', seed.toString('hex'))
    console.log('')
    
    // Supported chains
    const chains = ['BTC', 'ETH', 'BSC', 'DOGE', 'LTC', 'TRX', 'XRP', 'SOL']
    
    console.log('🔗 Deriving addresses for all supported chains...\n')
    
    // Derive first address for each chain
    for (const chain of chains) {
      const address = deriveAddressForChain(chain, seed, { index: 0 })
      console.log(`${chain.padEnd(4)} → ${address.address}`)
      console.log(`     Path: ${address.path}`)
      console.log(`     Private Key: ${address.privateKeyHex}`)
      if (address.xpub) {
        console.log(`     XPub: ${address.xpub}`)
      }
      console.log('')
    }
    
    console.log('✅ Basic example completed successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the example
basicExample().catch(console.error)
