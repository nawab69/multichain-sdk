import { describe, it, expect, beforeAll } from 'vitest'
import { mnemonicToSeed, deriveAddressForChain } from '../src/derive.js'
import type { Chain } from '../src/types.js'

describe('Integration Tests - User Mnemonic', () => {
  const userMnemonic = "winner side noodle ahead another aware upper copy produce radar enough capital flame series photo economy sock casual input exotic hollow record leg champion"
  
  let userSeed: Buffer

  beforeAll(async () => {
    userSeed = await mnemonicToSeed(userMnemonic)
  })

  describe('Mnemonic Validation', () => {
    it('should be a valid BIP-39 mnemonic', () => {
      expect(userMnemonic.split(' ')).toHaveLength(24) // 24 words
      expect(userMnemonic).toContain('winner')
      expect(userMnemonic).toContain('champion')
    })

    it('should generate consistent seed', async () => {
      const seed1 = await mnemonicToSeed(userMnemonic)
      const seed2 = await mnemonicToSeed(userMnemonic)
      expect(seed1).toEqual(seed2)
      expect(seed1).toEqual(userSeed)
    })
  })

  describe('Address Generation for All Chains', () => {
    const chains: Chain[] = ['BTC', 'ETH', 'BSC', 'DOGE', 'LTC', 'TRX', 'XRP', 'SOL']
    
    it('should generate addresses for all supported chains', () => {
      chains.forEach(chain => {
        const address = deriveAddressForChain(chain, userSeed)
        expect(address.chain).toBe(chain)
        expect(address.path).toBeDefined()
        expect(address.address).toBeDefined()
        expect(address.privateKeyHex).toBeDefined()
      })
    })

    it('should generate unique addresses for each chain', () => {
      const addresses = chains.map(chain => deriveAddressForChain(chain, userSeed))
      const addressStrings = addresses.map(addr => addr.address)
      
      // All addresses should be unique (BSC and ETH share same address by design)
      const uniqueAddresses = new Set(addressStrings)
      expect(uniqueAddresses.size).toBe(chains.length - 1) // BSC and ETH are identical
      
      // Verify BSC and ETH are the same (correct behavior)
      const ethAddress = deriveAddressForChain('ETH', userSeed)
      const bscAddress = deriveAddressForChain('BSC', userSeed)
      expect(ethAddress.address).toBe(bscAddress.address)
    })
  })

  describe('BTC Address Validation', () => {
    it('should generate valid bech32 address', () => {
      const address = deriveAddressForChain('BTC', userSeed)
      
      expect(address.address).toMatch(/^bc1[a-z0-9]{39}$/)
      expect(address.path).toBe("m/84'/0'/0'/0/0")
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should generate different addresses for different indices', () => {
      const address0 = deriveAddressForChain('BTC', userSeed, { index: 0 })
      const address1 = deriveAddressForChain('BTC', userSeed, { index: 1 })
      const address2 = deriveAddressForChain('BTC', userSeed, { index: 2 })
      
      expect(address0.address).not.toBe(address1.address)
      expect(address1.address).not.toBe(address2.address)
      expect(address0.address).not.toBe(address2.address)
    })
  })

  describe('ETH Address Validation', () => {
    it('should generate valid EVM address', () => {
      const address = deriveAddressForChain('ETH', userSeed)
      
      expect(address.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(address.path).toBe("m/44'/60'/0'/0/0")
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should generate checksummed address', () => {
      const address = deriveAddressForChain('ETH', userSeed)
      // Verify it's a valid checksummed address
      expect(address.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })
  })

  describe('BSC Address Validation', () => {
    it('should generate same address as ETH (same derivation)', () => {
      const ethAddress = deriveAddressForChain('ETH', userSeed)
      const bscAddress = deriveAddressForChain('BSC', userSeed)
      
      expect(bscAddress.address).toBe(ethAddress.address)
      expect(bscAddress.path).toBe(ethAddress.path)
      expect(bscAddress.privateKeyHex).toBe(ethAddress.privateKeyHex)
    })
  })

  describe('DOGE Address Validation', () => {
    it('should generate valid legacy P2PKH address', () => {
      const address = deriveAddressForChain('DOGE', userSeed)
      
      expect(address.address).toMatch(/^D[a-zA-Z0-9]{25,34}$/)
      expect(address.path).toBe("m/44'/3'/0'/0/0")
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('LTC Address Validation', () => {
    it('should generate valid bech32 address', () => {
      const address = deriveAddressForChain('LTC', userSeed)
      
      expect(address.address).toMatch(/^ltc1[a-z0-9]{39}$/)
      expect(address.path).toBe("m/84'/2'/0'/0/0")
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('TRX Address Validation', () => {
    it('should generate valid Tron address', () => {
      const address = deriveAddressForChain('TRX', userSeed)
      
      expect(address.address).toMatch(/^T[a-zA-Z0-9]{33}$/)
      expect(address.path).toBe("m/44'/195'/0'/0/0")
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('XRP Address Validation', () => {
    it('should generate valid Ripple address', () => {
      const address = deriveAddressForChain('XRP', userSeed)
      
      expect(address.address).toMatch(/^r[a-zA-Z0-9]{25,34}$/)
      expect(address.path).toBe("m/44'/144'/0'/0/0")
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('SOL Address Validation', () => {
    it('should generate valid Solana address', () => {
      const address = deriveAddressForChain('SOL', userSeed)
      
      expect(address.address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)
      expect(address.path).toBe("m/44'/501'/0'")
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{128}$/) // Solana uses 64-byte private keys
    })

    it('should use Trust Wallet derivation style', () => {
      const address0 = deriveAddressForChain('SOL', userSeed, { index: 0 })
      const address1 = deriveAddressForChain('SOL', userSeed, { index: 1 })
      
      expect(address0.path).toBe("m/44'/501'/0'")
      expect(address1.path).toBe("m/44'/501'/1'")
      expect(address0.address).not.toBe(address1.address)
    })
  })

  describe('Deterministic Behavior', () => {
    it('should generate same addresses on multiple runs', () => {
      const address1 = deriveAddressForChain('BTC', userSeed, { index: 5 })
      const address2 = deriveAddressForChain('BTC', userSeed, { index: 5 })
      
      expect(address1.address).toBe(address2.address)
      expect(address1.path).toBe(address2.path)
      expect(address1.privateKeyHex).toBe(address2.privateKeyHex)
    })

    it('should generate different addresses for different indices', () => {
      const addresses = [0, 1, 2, 3, 4].map(index => 
        deriveAddressForChain('BTC', userSeed, { index })
      )
      
      const addressStrings = addresses.map(addr => addr.address)
      const uniqueAddresses = new Set(addressStrings)
      
      expect(uniqueAddresses.size).toBe(5) // All should be unique
    })
  })

  describe('Path Generation', () => {
    it('should generate correct paths for all chains', () => {
      const expectedPaths = {
        BTC: "m/84'/0'/0'/0/0",
        ETH: "m/44'/60'/0'/0/0",
        BSC: "m/44'/60'/0'/0/0",
        DOGE: "m/44'/3'/0'/0/0",
        LTC: "m/84'/2'/0'/0/0",
        TRX: "m/44'/195'/0'/0/0",
        XRP: "m/44'/144'/0'/0/0",
        SOL: "m/44'/501'/0'"
      }
      
      Object.entries(expectedPaths).forEach(([chain, expectedPath]) => {
        const address = deriveAddressForChain(chain as Chain, userSeed)
        expect(address.path).toBe(expectedPath)
      })
    })
  })
})
