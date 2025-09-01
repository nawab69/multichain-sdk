import * as bip39 from 'bip39'
import { mnemonicToSeed, deriveAddressForChain } from './index.js'
import type { Chain } from './types.js'

async function main() {
  // Test with the specific mnemonic provided
  const mnemonic = "winner side noodle ahead another aware upper copy produce radar enough capital flame series photo economy sock casual input exotic hollow record leg champion"
  console.log('Testing mnemonic:', mnemonic)
  console.log('Mnemonic valid:', bip39.validateMnemonic(mnemonic))
  console.log('')

  const seed = await mnemonicToSeed(mnemonic)
  console.log('Seed (hex):', seed.toString('hex'))
  console.log('')

  const chains: Chain[] = ['BTC','ETH','BSC','DOGE','LTC','TRX','XRP','SOL']

  console.log('=== ADDRESS DERIVATION RESULTS ===')
  console.log('')

  for (const c of chains) {
    console.log(`--- ${c} ---`)
    
    // Test multiple indices to show deterministic behavior
    for (let i = 0; i <= 2; i++) {
      const addr = deriveAddressForChain(c, seed, { account: 0, change: 0, index: i })
      console.log(`Index ${i}: ${addr.address}`)
      console.log(`Path: ${addr.path}`)
      console.log(`Private Key: ${addr.privateKeyHex?.substring(0, 8)}...`)
      if (addr.xpub) {
        console.log(`XPub: ${addr.xpub.substring(0, 20)}...`)
      }
      console.log('')
    }
  }

  console.log('=== VERIFICATION ===')
  console.log('All addresses should match Trust Wallet when using the same mnemonic')
  console.log('Derivation paths follow BIP-44/SLIP-44 standards')
}

main().catch(console.error)
