import { mnemonicToSeed, deriveAddressForChain, deriveXPubForChain, deriveWatchOnlyAddress } from '../dist/index.js'

async function main() {
  // Example mnemonic (use your own for testing)
  const mnemonic = "winner side noodle ahead another aware upper copy produce radar enough capital flame series photo economy sock casual input exotic hollow record leg champion"
  
  console.log('🔐 WATCH-ONLY ADDRESS DERIVATION EXAMPLE')
  console.log('=' .repeat(60))
  console.log('Mnemonic:', mnemonic)
  console.log('')

  const seed = await mnemonicToSeed(mnemonic)
  console.log('Seed derived successfully')
  console.log('')

  // Define chains that support xpub (excluding SOL)
  const chains = ['BTC', 'ETH', 'BSC', 'DOGE', 'LTC', 'TRX', 'XRP']

  console.log('📊 STEP 1: DERIVE XPUBS FROM SEED')
  console.log('=' .repeat(60))

  const xpubs = {}
  
  for (const chain of chains) {
    try {
      // Derive xpub for account 0
      const xpubResult = deriveXPubForChain(chain, seed, { account: 0 })
      xpubs[chain] = xpubResult
      
      console.log(`\n--- ${chain} ---`)
      console.log(`Path: ${xpubResult.path}`)
      console.log(`Network: ${xpubResult.network}`)
      console.log(`XPub: ${xpubResult.xpub}`)
    } catch (error) {
      console.log(`\n--- ${chain} ---`)
      console.log(`Error: ${error.message}`)
    }
  }

  console.log('\n' + '=' .repeat(60))
  console.log('👀 STEP 2: DERIVE WATCH-ONLY ADDRESSES FROM XPUBS')
  console.log('=' .repeat(60))

  for (const chain of chains) {
    if (!xpubs[chain]) continue
    
    console.log(`\n--- ${chain} Watch-Only Addresses ---`)
    
    // Derive first 3 addresses (change=0, index=0,1,2)
    for (let i = 0; i < 3; i++) {
      try {
        const watchOnly = deriveWatchOnlyAddress(chain, xpubs[chain].xpub, 0, i, xpubs[chain].network === 'testnet')
        console.log(`Index ${i}: ${watchOnly.address}`)
        console.log(`Path: ${watchOnly.path}`)
      } catch (error) {
        console.log(`Index ${i}: Error - ${error.message}`)
      }
    }
  }

  console.log('\n' + '=' .repeat(60))
  console.log('🧪 STEP 3: COMPARE WITH ORIGINAL DERIVATION')
  console.log('=' .repeat(60))

  for (const chain of chains) {
    if (!xpubs[chain]) continue
    
    console.log(`\n--- ${chain} Comparison ---`)
    
    // Derive original address with private key
    const original = deriveAddressForChain(chain, seed, { account: 0, change: 0, index: 0 })
    
    // Derive watch-only address
    const watchOnly = deriveWatchOnlyAddress(chain, xpubs[chain].xpub, 0, 0, xpubs[chain].network === 'testnet')
    
    console.log(`Original:  ${original.address}`)
    console.log(`Watch-Only: ${watchOnly.address}`)
    console.log(`Match: ${original.address === watchOnly.address ? '✅' : '❌'}`)
    console.log(`Private Key Available: ${original.privateKeyHex ? '✅' : '❌'}`)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('🔒 SECURITY BENEFITS:')
  console.log('1. XPub can be shared safely (no private keys)')
  console.log('2. Watch-only addresses can be generated without seed')
  console.log('3. Perfect for monitoring wallets without signing capability')
  console.log('4. Ideal for cold storage + hot monitoring setups')
  console.log('5. Solana not supported (uses ed25519, not BIP32)')
  console.log('')
  console.log('⚠️  IMPORTANT NOTES:')
  console.log('- XPub allows deriving all addresses in the account')
  console.log('- Keep XPub secure - it reveals all public keys')
  console.log('- Use different accounts for different purposes')
  console.log('- Testnet and mainnet have different XPub formats')
}

main().catch(console.error)
