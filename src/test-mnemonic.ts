import * as bip39 from 'bip39'
import { mnemonicToSeed, deriveAddressForChain } from './index.js'
import type { Chain } from './types.js'

async function main() {
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
    for (let i = 0; i <= 2; i++) {
      const addr = deriveAddressForChain(c, seed, { account: 0, change: 0, index: i })
      console.log(`Index ${i}: ${addr.address}`)
      console.log(`Path: ${addr.path}`)
      console.log(`Private Key: ${addr.privateKeyHex}`)
      if (addr.xpub) {
        console.log(`XPub: ${addr.xpub}`)
      }
      console.log('')
      // For Solana, show the 32-byte private key format
      if (c === 'SOL' && addr.privateKeyArray) {
        console.log(`Private Key (32 bytes): ${addr.privateKeyHex}`)
        console.log(`Private Key Array: [${addr.privateKeyArray.join(', ')}]`)
      }
    }
  }

  console.log('=== VERIFICATION INSTRUCTIONS ===')
  console.log('1. Import this mnemonic into Trust Wallet')
  console.log('2. For each chain, verify the addresses match')
  console.log('3. For each chain, verify the private keys match')
  console.log('4. Note: Solana uses Trust Wallet derivation (m/44\'/501\'/account\')')
  console.log('5. Note: BSC and ETH share the same derivation path')
  console.log('')
  console.log('=== PRIVATE KEY FORMATS ===')
  console.log('BTC/ETH/BSC/DOGE/LTC/TRX/XRP: 64 hex characters (32 bytes)')
  console.log('SOL: 64 hex characters (32 bytes, ed25519 seed)')
  console.log('All private keys are raw hex without 0x prefix')
  console.log('For Solana Trust Wallet import, use the 32-byte format (64 hex chars)')
  console.log('')
  console.log('=== TRUST WALLET COMPATIBILITY ===')
  console.log('✅ BTC: BIP84 bech32 P2WPKH (m/84\'/0\'/0\'/0/index)')
  console.log('✅ ETH: BIP44 EVM (m/44\'/60\'/0\'/0/index)')
  console.log('✅ BSC: Same as ETH (m/44\'/60\'/0\'/0/index)')
  console.log('✅ DOGE: BIP44 legacy (m/44\'/3\'/0\'/0/index)')
  console.log('✅ LTC: BIP84 bech32 P2WPKH (m/84\'/2\'/0\'/0/index)')
  console.log('✅ TRX: BIP44 Tron (m/44\'/195\'/0\'/0/index)')
  console.log('✅ XRP: BIP44 Ripple (m/44\'/144\'/0\'/0/index)')
  console.log('✅ SOL: Trust Wallet style (m/44\'/501\'/account\')')
  console.log('')
  console.log('All addresses should match Trust Wallet when using the same mnemonic')
  console.log('All private keys should match Trust Wallet when using the same mnemonic')
}

main().catch(console.error)
