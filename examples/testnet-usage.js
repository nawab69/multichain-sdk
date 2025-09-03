import { mnemonicToSeed, deriveAddressForChain } from '../dist/index.js'

async function main() {
  // Example mnemonic (use your own for testing)
  const mnemonic = "winner side noodle ahead another aware upper copy produce radar enough capital flame series photo economy sock casual input exotic hollow record leg champion"
  
  console.log('🧪 TESTNET ADDRESS GENERATION EXAMPLE')
  console.log('=' .repeat(50))
  console.log('Mnemonic:', mnemonic)
  console.log('')

  const seed = await mnemonicToSeed(mnemonic)
  console.log('Seed derived successfully')
  console.log('')

  // Define chains to test
  const chains = ['BTC', 'ETH', 'BSC', 'DOGE', 'LTC', 'TRX', 'XRP', 'SOL']

  console.log('🌐 MAINNET vs TESTNET COMPARISON')
  console.log('=' .repeat(50))

  for (const chain of chains) {
    console.log(`\n--- ${chain} ---`)
    
    // Mainnet address
    const mainnet = deriveAddressForChain(chain, seed, { 
      account: 0, 
      change: 0, 
      index: 0 
    })
    
    // Testnet address
    const testnet = deriveAddressForChain(chain, seed, { 
      account: 0, 
      change: 0, 
      index: 0, 
      testnet: true 
    })

    console.log(`Mainnet: ${mainnet.address}`)
    console.log(`Testnet: ${testnet.address}`)
    console.log(`Path: ${mainnet.path}`)
    console.log(`Private Key: ${mainnet.privateKeyHex}`)
    
    // Show network-specific differences
    if (chain === 'BTC') {
      console.log('Note: BTC testnet uses tb1 prefix, mainnet uses bc1')
    } else if (chain === 'LTC') {
      console.log('Note: LTC testnet uses tltc prefix, mainnet uses ltc1')
    } else if (chain === 'TRX') {
      console.log('Note: TRX testnet uses Shasta API, mainnet uses TronGrid')
    }
  }

  console.log('\n' + '=' .repeat(50))
  console.log('🧪 TESTNET USAGE TIPS:')
  console.log('1. Use testnet: true option for testnet addresses')
  console.log('2. Same derivation paths, different network parameters')
  console.log('3. Private keys remain the same (network independent)')
  console.log('4. Perfect for development and testing')
  console.log('5. Testnet faucets available for most chains')
}

main().catch(console.error)
