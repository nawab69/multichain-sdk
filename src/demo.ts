import * as bip39 from 'bip39'
import { mnemonicToSeed, deriveAddressForChain } from './index.js'
import type { Chain } from './types.js'

async function main() {
  // DEV DEMO ONLY — in production you'll collect mnemonic from secure UX flow
  const mnemonic = bip39.generateMnemonic(256)
  console.log('Mnemonic (DEMO):', mnemonic)

  const seed = await mnemonicToSeed(mnemonic)

  const chains: Chain[] = ['BTC','ETH','BSC','DOGE','LTC','TRX','XRP','SOL']

  for (const c of chains) {
    const a0 = deriveAddressForChain(c, seed, { account: 0, change: 0, index: 0 })
    const a1 = deriveAddressForChain(c, seed, { account: 0, change: 0, index: 1 })
    console.log(c, '→', a0.address, 'path:', a0.path)
    console.log(c, '→', a1.address, 'path:', a1.path)
  }
}

main().catch(console.error)
