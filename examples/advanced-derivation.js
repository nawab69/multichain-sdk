#!/usr/bin/env node

/**
 * Advanced Derivation Example for Multichain Seed SDK
 * 
 * This example demonstrates:
 * 1. Multiple accounts and indices
 * 2. Custom derivation paths
 * 3. Change addresses (internal/external)
 * 4. Batch address generation
 */

import { mnemonicToSeed, deriveAddressForChain } from '../dist/index.js'

async function advancedExample() {
  console.log('🚀 Multichain Seed SDK - Advanced Derivation Example\n')
  
  // Example mnemonic (24 words for demo purposes)
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art"
  
  console.log('📝 Mnemonic:', mnemonic)
  console.log('')
  
  try {
    const seed = await mnemonicToSeed(mnemonic)
    console.log('🌱 Seed (hex):', seed.toString('hex'))
    console.log('')
    
    // Example 1: Multiple accounts for Bitcoin
    console.log('🔐 Example 1: Multiple Bitcoin Accounts')
    console.log('=====================================')
    for (let account = 0; account < 3; account++) {
      const address = deriveAddressForChain('BTC', seed, { account, index: 0 })
      console.log(`Account ${account}: ${address.address}`)
      console.log(`Path: ${address.path}`)
      console.log('')
    }
    
    // Example 2: Multiple indices for Ethereum
    console.log('🔐 Example 2: Multiple Ethereum Indices')
    console.log('=======================================')
    for (let index = 0; index < 5; index++) {
      const address = deriveAddressForChain('ETH', seed, { index })
      console.log(`Index ${index}: ${address.address}`)
      console.log(`Path: ${address.path}`)
      console.log('')
    }
    
    // Example 3: Change addresses (internal/external)
    console.log('🔐 Example 3: Change Addresses (Internal/External)')
    console.log('==================================================')
    const external = deriveAddressForChain('BTC', seed, { change: 0, index: 0 })
    const internal = deriveAddressForChain('BTC', seed, { change: 1, index: 0 })
    console.log(`External (change=0): ${external.address}`)
    console.log(`Path: ${external.path}`)
    console.log(`Internal (change=1): ${internal.address}`)
    console.log(`Path: ${internal.path}`)
    console.log('')
    
    // Example 4: Custom derivation path
    console.log('🔐 Example 4: Custom Derivation Path')
    console.log('====================================')
    const customPath = "m/44'/0'/0'/0/42"
    const customAddress = deriveAddressForChain('BTC', seed, { customPath })
    console.log(`Custom Path: ${customPath}`)
    console.log(`Address: ${customAddress.address}`)
    console.log('')
    
    // Example 5: Solana Trust Wallet style derivation
    console.log('🔐 Example 5: Solana Trust Wallet Style')
    console.log('=======================================')
    for (let index = 0; index < 3; index++) {
      const address = deriveAddressForChain('SOL', seed, { index })
      console.log(`Index ${index}: ${address.address}`)
      console.log(`Path: ${address.path}`)
      console.log(`Private Key (32 bytes): ${address.privateKeyHex}`)
      console.log('')
    }
    
    // Example 6: Batch generation for multiple chains
    console.log('🔐 Example 6: Batch Generation for Multiple Chains')
    console.log('==================================================')
    const chains = ['BTC', 'ETH', 'SOL']
    const batchAddresses = chains.map(chain => 
      deriveAddressForChain(chain, seed, { account: 1, index: 5 })
    )
    
    batchAddresses.forEach((address, i) => {
      console.log(`${chains[i].padEnd(4)} → ${address.address}`)
      console.log(`     Path: ${address.path}`)
    })
    
    console.log('\n✅ Advanced example completed successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the example
advancedExample().catch(console.error)
