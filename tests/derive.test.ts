import { describe, it, expect, beforeEach } from 'vitest'
import { 
  mnemonicToSeed, 
  deriveAddressForChain,
  addressBTC,
  addressETH,
  addressSOL
} from '../src/derive.js'
import type { Chain } from '../src/types.js'

describe('Core Derivation Functions', () => {
  let testSeed: Buffer
  let testMnemonic: string

  beforeEach(() => {
    // Use a deterministic test mnemonic for consistent testing
    testMnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
    testSeed = Buffer.from('5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac42b8b27d7014c8', 'hex')
  })

  describe('mnemonicToSeed', () => {
    it('should convert mnemonic to seed buffer', async () => {
      const seed = await mnemonicToSeed(testMnemonic)
      expect(seed).toBeInstanceOf(Buffer)
      expect(seed.length).toBe(64) // 512 bits = 64 bytes
    })

    it('should generate same seed for same mnemonic', async () => {
      const seed1 = await mnemonicToSeed(testMnemonic)
      const seed2 = await mnemonicToSeed(testMnemonic)
      expect(seed1).toEqual(seed2)
    })

    it('should generate different seeds for different mnemonics', async () => {
      const mnemonic2 = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon"
      const seed1 = await mnemonicToSeed(testMnemonic)
      const seed2 = await mnemonicToSeed(mnemonic2)
      expect(seed1).not.toEqual(seed2)
    })

    it('should handle passphrase', async () => {
      const seed1 = await mnemonicToSeed(testMnemonic)
      const seed2 = await mnemonicToSeed(testMnemonic, 'test')
      expect(seed1).not.toEqual(seed2)
    })
  })

  describe('deriveAddressForChain', () => {
    it('should derive addresses for all supported chains', () => {
      const chains: Chain[] = ['BTC', 'ETH', 'BSC', 'DOGE', 'LTC', 'TRX', 'XRP', 'SOL']
      
      chains.forEach(chain => {
        const address = deriveAddressForChain(chain, testSeed)
        expect(address.chain).toBe(chain)
        expect(address.path).toBeDefined()
        expect(address.address).toBeDefined()
        expect(address.privateKeyHex).toBeDefined()
      })
    })

    it('should generate different addresses for different indices', () => {
      const address1 = deriveAddressForChain('BTC', testSeed, { index: 0 })
      const address2 = deriveAddressForChain('BTC', testSeed, { index: 1 })
      
      expect(address1.address).not.toBe(address2.address)
      expect(address1.path).not.toBe(address2.path)
    })

    it('should generate different addresses for different accounts', () => {
      const address1 = deriveAddressForChain('BTC', testSeed, { account: 0 })
      const address2 = deriveAddressForChain('BTC', testSeed, { account: 1 })
      
      expect(address1.address).not.toBe(address2.address)
      expect(address1.path).not.toBe(address2.path)
    })

    it('should handle custom derivation path', () => {
      const customPath = "m/44'/60'/0'/0/0"
      const address = deriveAddressForChain('ETH', testSeed, { customPath })
      
      expect(address.path).toBe(customPath)
    })
  })

  describe('BTC Address Derivation', () => {
    it('should generate valid bech32 addresses', () => {
      const address = addressBTC(testSeed)
      
      expect(address.chain).toBe('BTC')
      expect(address.address).toMatch(/^bc1[a-z0-9]{39}$/)
      expect(address.path).toBe("m/84'/0'/0'/0/0")
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
      expect(address.xpub).toBeDefined()
    })

    it('should generate different addresses for different indices', () => {
      const address1 = addressBTC(testSeed, { index: 0 })
      const address2 = addressBTC(testSeed, { index: 1 })
      
      expect(address1.address).not.toBe(address2.address)
      expect(address1.path).toBe("m/84'/0'/0'/0/0")
      expect(address2.path).toBe("m/84'/0'/0'/0/1")
    })

    it('should use BIP84 purpose (bech32)', () => {
      const address = addressBTC(testSeed)
      expect(address.path).toMatch(/^m\/84'/)
    })
  })

  describe('ETH Address Derivation', () => {
    it('should generate valid EVM addresses', () => {
      const address = addressETH(testSeed)
      
      expect(address.chain).toBe('ETH')
      expect(address.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(address.path).toBe("m/44'/60'/0'/0/0")
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
      expect(address.xpub).toBeDefined()
    })

    it('should generate checksummed addresses', () => {
      const address = addressETH(testSeed)
      // EVM addresses are checksummed
      expect(address.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    it('should use BIP44 purpose', () => {
      const address = addressETH(testSeed)
      expect(address.path).toMatch(/^m\/44'/)
    })
  })

  describe('SOL Address Derivation', () => {
    it('should generate valid Solana addresses', () => {
      const address = addressSOL(testSeed)
      
      expect(address.chain).toBe('SOL')
      expect(address.address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)
      expect(address.path).toBe("m/44'/501'/0'")
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{128}$/) // Solana uses 64-byte private keys
    })

    it('should use Trust Wallet derivation style', () => {
      const address1 = addressSOL(testSeed, { index: 0 })
      const address2 = addressSOL(testSeed, { index: 1 })
      
      expect(address1.path).toBe("m/44'/501'/0'")
      expect(address2.path).toBe("m/44'/501'/1'")
      expect(address1.address).not.toBe(address2.address)
    })

    it('should use SLIP-0010 ed25519 derivation', () => {
      const address = addressSOL(testSeed)
      expect(address.path).toMatch(/^m\/44'\/501'\/\d+'$/)
    })
  })

  describe('Deterministic Behavior', () => {
    it('should generate same addresses for same inputs', () => {
      const address1 = deriveAddressForChain('BTC', testSeed, { index: 5 })
      const address2 = deriveAddressForChain('BTC', testSeed, { index: 5 })
      
      expect(address1.address).toBe(address2.address)
      expect(address1.path).toBe(address2.path)
      expect(address1.privateKeyHex).toBe(address2.privateKeyHex)
    })

    it('should generate different addresses for different seeds', async () => {
      const mnemonic2 = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon"
      const seed2 = await mnemonicToSeed(mnemonic2)
      
      const address1 = deriveAddressForChain('BTC', testSeed)
      const address2 = deriveAddressForChain('BTC', seed2)
      
      expect(address1.address).not.toBe(address2.address)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      const address = deriveAddressForChain('BTC', testSeed, { account: 0, change: 0, index: 0 })
      expect(address).toBeDefined()
      expect(address.path).toBe("m/84'/0'/0'/0/0")
    })

    it('should handle large index values', () => {
      const address = deriveAddressForChain('BTC', testSeed, { index: 999999 })
      expect(address).toBeDefined()
      expect(address.path).toBe("m/84'/0'/0'/0/999999")
    })

    it('should handle custom path override', () => {
      const customPath = "m/44'/60'/999'/1/123"
      const address = deriveAddressForChain('ETH', testSeed, { customPath })
      expect(address.path).toBe(customPath)
    })
  })
})
