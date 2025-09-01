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

  beforeEach(async () => {
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
    testSeed = await mnemonicToSeed(mnemonic)
  })

  describe('mnemonicToSeed', () => {
    it('should convert mnemonic to 64-byte seed', async () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      const seed = await mnemonicToSeed(mnemonic)
      
      expect(seed).toBeInstanceOf(Buffer)
      expect(seed.length).toBe(64)
    })

    it('should generate deterministic seeds', async () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      const seed1 = await mnemonicToSeed(mnemonic)
      const seed2 = await mnemonicToSeed(mnemonic)
      
      expect(seed1).toEqual(seed2)
    })

    it('should handle passphrase', async () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      const seed1 = await mnemonicToSeed(mnemonic)
      const seed2 = await mnemonicToSeed(mnemonic, 'test')
      
      expect(seed1).not.toEqual(seed2)
    })
  })

  describe('deriveAddressForChain', () => {
    it('should derive addresses for all supported chains', () => {
      const chains = ['BTC', 'ETH', 'BSC', 'DOGE', 'LTC', 'TRX', 'XRP', 'SOL'] as const
      
      chains.forEach(chain => {
        const result = deriveAddressForChain(chain, testSeed)
        expect(result.chain).toBe(chain)
        expect(result.address).toBeDefined()
        expect(result.path).toBeDefined()
        expect(result.privateKeyHex).toBeDefined()
      })
    })

    it('should generate deterministic addresses', () => {
      const result1 = deriveAddressForChain('BTC', testSeed, { index: 5 })
      const result2 = deriveAddressForChain('BTC', testSeed, { index: 5 })
      
      expect(result1.address).toBe(result2.address)
      expect(result1.privateKeyHex).toBe(result2.privateKeyHex)
    })

    it('should handle different parameters', () => {
      const result1 = deriveAddressForChain('BTC', testSeed, { account: 0, change: 0, index: 0 })
      const result2 = deriveAddressForChain('BTC', testSeed, { account: 1, change: 1, index: 5 })
      
      expect(result1.address).not.toBe(result2.address)
      expect(result1.privateKeyHex).not.toBe(result2.privateKeyHex)
    })
  })

  describe('Private Key Derivation', () => {
    it('should generate valid private keys for BTC', () => {
      const result = addressBTC(testSeed, { index: 0 })
      
      expect(result.privateKeyHex).toBeDefined()
      expect(result.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
      expect(result.privateKeyHex).not.toContain('0x')
      
      // Verify deterministic behavior
      const result2 = addressBTC(testSeed, { index: 0 })
      expect(result.privateKeyHex).toBe(result2.privateKeyHex)
    })

    it('should generate valid private keys for ETH', () => {
      const result = addressETH(testSeed, { index: 0 })
      
      expect(result.privateKeyHex).toBeDefined()
      expect(result.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
      expect(result.privateKeyHex).not.toContain('0x')
      
      // Verify deterministic behavior
      const result2 = addressETH(testSeed, { index: 0 })
      expect(result.privateKeyHex).toBe(result2.privateKeyHex)
    })

    it('should generate valid private keys for SOL', () => {
      const result = addressSOL(testSeed, { index: 0 })
      
      expect(result.privateKeyHex).toBeDefined()
      expect(result.privateKeyHex).toMatch(/^[a-f0-9]{64}$/) // ed25519 private key is 32 bytes = 64 hex chars
      expect(result.privateKeyHex).not.toContain('0x')
      
      // Verify deterministic behavior
      const result2 = addressSOL(testSeed, { index: 0 })
      expect(result.privateKeyHex).toBe(result2.privateKeyHex)
    })

    it('should generate different private keys for different indices', () => {
      const btc1 = addressBTC(testSeed, { index: 0 })
      const btc2 = addressBTC(testSeed, { index: 1 })
      const btc3 = addressBTC(testSeed, { index: 2 })
      
      expect(btc1.privateKeyHex).not.toBe(btc2.privateKeyHex)
      expect(btc2.privateKeyHex).not.toBe(btc3.privateKeyHex)
      expect(btc1.privateKeyHex).not.toBe(btc3.privateKeyHex)
    })

    it('should generate different private keys for different accounts', () => {
      const btc1 = addressBTC(testSeed, { account: 0, index: 0 })
      const btc2 = addressBTC(testSeed, { account: 1, index: 0 })
      
      expect(btc1.privateKeyHex).not.toBe(btc2.privateKeyHex)
    })

    it('should generate different private keys for different chains', () => {
      const btc = addressBTC(testSeed, { index: 0 })
      const eth = addressETH(testSeed, { index: 0 })
      const sol = addressSOL(testSeed, { index: 0 })
      
      expect(btc.privateKeyHex).not.toBe(eth.privateKeyHex)
      expect(eth.privateKeyHex).not.toBe(sol.privateKeyHex)
      expect(btc.privateKeyHex).not.toBe(sol.privateKeyHex)
    })

    it('should maintain private key consistency across multiple calls', () => {
      const btc1 = addressBTC(testSeed, { index: 5 })
      const btc2 = addressBTC(testSeed, { index: 5 })
      const btc3 = addressBTC(testSeed, { index: 5 })
      
      expect(btc1.privateKeyHex).toBe(btc2.privateKeyHex)
      expect(btc2.privateKeyHex).toBe(btc3.privateKeyHex)
      expect(btc1.privateKeyHex).toBe(btc3.privateKeyHex)
    })

    it('should handle custom derivation paths with private keys', () => {
      const customPath = "m/44'/0'/0'/0/42"
      const result = addressBTC(testSeed, { customPath })
      
      expect(result.privateKeyHex).toBeDefined()
      expect(result.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
      expect(result.path).toBe(customPath)
    })
  })

  describe('addressBTC', () => {
    it('should generate valid bech32 addresses', () => {
      const result = addressBTC(testSeed)
      
      expect(result.chain).toBe('BTC')
      expect(result.address).toMatch(/^bc1[a-z0-9]{39}$/)
      expect(result.path).toBe("m/84'/0'/0'/0/0")
      expect(result.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
      expect(result.xpub).toBeDefined()
    })

    it('should handle different indices', () => {
      const result1 = addressBTC(testSeed, { index: 0 })
      const result2 = addressBTC(testSeed, { index: 1 })
      
      expect(result1.address).not.toBe(result2.address)
      expect(result1.privateKeyHex).not.toBe(result2.privateKeyHex)
    })
  })

  describe('addressETH', () => {
    it('should generate valid checksum addresses', () => {
      const result = addressETH(testSeed)
      
      expect(result.chain).toBe('ETH')
      expect(result.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(result.path).toBe("m/44'/60'/0'/0/0")
      expect(result.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
      expect(result.xpub).toBeDefined()
    })

    it('should handle different indices', () => {
      const result1 = addressETH(testSeed, { index: 0 })
      const result2 = addressETH(testSeed, { index: 1 })
      
      expect(result1.address).not.toBe(result2.address)
      expect(result1.privateKeyHex).not.toBe(result2.privateKeyHex)
    })
  })

  describe('addressSOL', () => {
    it('should generate valid base58 addresses', () => {
      const result = addressSOL(testSeed)
      
      expect(result.chain).toBe('SOL')
      expect(result.address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)
      expect(result.path).toBe("m/44'/501'/0'")
      expect(result.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
      expect(result.xpub).toBeUndefined() // Solana doesn't use xpub
    })

    it('should handle different indices', () => {
      const result1 = addressSOL(testSeed, { index: 0 })
      const result2 = addressSOL(testSeed, { index: 1 })
      
      expect(result1.address).not.toBe(result2.address)
      expect(result1.privateKeyHex).not.toBe(result2.privateKeyHex)
    })
  })
})

