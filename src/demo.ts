import * as bip39 from 'bip39'
import { mnemonicToSeed, deriveAddressForChain } from './index.js'
import type { Chain } from './types.js'

async function main() {
  // DEV DEMO ONLY — in production you'll collect mnemonic from secure UX flow
  const mnemonic = bip39.generateMnemonic(256)
  console.log('Mnemonic (DEMO):', mnemonic)

  const seed = await mnemonicToSeed(mnemonic)

  const chains: Chain[] = ['BTC','ETH','BSC','DOGE','LTC','TRX','XRP','SOL']

  console.log('\n🌐 MAINNET ADDRESSES:')
  console.log('='.repeat(50))
  
  for (const c of chains) {
    const a0 = deriveAddressForChain(c, seed, { account: 0, change: 0, index: 0 })
    const a1 = deriveAddressForChain(c, seed, { account: 0, change: 0, index: 1 })
    console.log(`${c.padEnd(4)} → ${a0.address.padEnd(50)} path: ${a0.path}`)
    console.log(`${c.padEnd(4)} → ${a1.address.padEnd(50)} path: ${a1.path}`)
  }

  console.log('\n🧪 TESTNET ADDRESSES:')
  console.log('='.repeat(50))
  
  for (const c of chains) {
    const a0 = deriveAddressForChain(c, seed, { account: 0, change: 0, index: 0, testnet: true })
    const a1 = deriveAddressForChain(c, seed, { account: 0, change: 0, index: 1, testnet: true })
    console.log(`${c.padEnd(4)} → ${a0.address.padEnd(50)} path: ${a0.path} (testnet)`)
    console.log(`${c.padEnd(4)} → ${a1.address.padEnd(50)} path: ${a1.path} (testnet)`)
  }
}

main().catch(console.error)
