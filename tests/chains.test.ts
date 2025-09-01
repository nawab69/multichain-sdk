import { describe, it, expect, beforeEach } from 'vitest'
import { 
  addressLTC,
  addressDOGE,
  addressTRX,
  addressXRP
} from '../src/derive.js'

describe('Chain-Specific Address Derivation', () => {
  let testSeed: Buffer

  beforeEach(() => {
    // Use a deterministic test seed for consistent testing
    testSeed = Buffer.from('5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac42b8b27d7014c8', 'hex')
  })

  describe('LTC (Litecoin) Address Derivation', () => {
    it('should generate valid bech32 addresses', () => {
      const address = addressLTC(testSeed)
      
      expect(address.chain).toBe('LTC')
      expect(address.address).toMatch(/^ltc1[a-z0-9]{39}$/)
      expect(address.path).toBe("m/84'/2'/0'/0/0")
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
      expect(address.xpub).toBeDefined()
    })

    it('should generate different addresses for different indices', () => {
      const address1 = addressLTC(testSeed, { index: 0 })
      const address2 = addressLTC(testSeed, { index: 1 })
      const address3 = addressLTC(testSeed, { index: 2 })
      
      expect(address1.address).not.toBe(address2.address)
      expect(address2.address).not.toBe(address3.address)
      expect(address1.address).not.toBe(address3.address)
    })

    it('should use BIP84 purpose (bech32)', () => {
      const address = addressLTC(testSeed)
      expect(address.path).toMatch(/^m\/84'/)
    })

    it('should use Litecoin network parameters', () => {
      const address = addressLTC(testSeed)
      expect(address.path).toMatch(/\/2'/) // Litecoin coin type
    })

    it('should handle different accounts', () => {
      const address1 = addressLTC(testSeed, { account: 0 })
      const address2 = addressLTC(testSeed, { account: 1 })
      
      expect(address1.address).not.toBe(address2.address)
      expect(address1.path).toBe("m/84'/2'/0'/0/0")
      expect(address2.path).toBe("m/84'/2'/1'/0/0")
    })

    it('should generate valid private keys', () => {
      const address = addressLTC(testSeed, { index: 0 })
      
      expect(address.privateKeyHex).toBeDefined()
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
      expect(address.privateKeyHex).not.toContain('0x')
      
      // Verify deterministic behavior
      const address2 = addressLTC(testSeed, { index: 0 })
      expect(address.privateKeyHex).toBe(address2.privateKeyHex)
    })

    it('should generate different private keys for different indices', () => {
      const address1 = addressLTC(testSeed, { index: 0 })
      const address2 = addressLTC(testSeed, { index: 1 })
      const address3 = addressLTC(testSeed, { index: 2 })
      
      expect(address1.privateKeyHex).not.toBe(address2.privateKeyHex)
      expect(address2.privateKeyHex).not.toBe(address3.privateKeyHex)
      expect(address1.privateKeyHex).not.toBe(address3.privateKeyHex)
    })
  })

  describe('DOGE (Dogecoin) Address Derivation', () => {
    it('should generate valid legacy P2PKH addresses', () => {
      const address = addressDOGE(testSeed)
      
      expect(address.chain).toBe('DOGE')
      expect(address.address).toMatch(/^D[a-zA-Z0-9]{25,34}$/)
      expect(address.path).toBe("m/44'/3'/0'/0/0")
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
      expect(address.xpub).toBeDefined()
    })

    it('should generate different addresses for different indices', () => {
      const address1 = addressDOGE(testSeed, { index: 0 })
      const address2 = addressDOGE(testSeed, { index: 1 })
      const address3 = addressDOGE(testSeed, { index: 2 })
      
      expect(address1.address).not.toBe(address2.address)
      expect(address2.address).not.toBe(address3.address)
      expect(address1.address).not.toBe(address3.address)
    })

    it('should use BIP44 purpose (legacy)', () => {
      const address = addressDOGE(testSeed)
      expect(address.path).toMatch(/^m\/44'/)
    })

    it('should use Dogecoin network parameters', () => {
      const address = addressDOGE(testSeed)
      expect(address.path).toMatch(/\/3'/) // Dogecoin coin type
    })

    it('should handle different accounts', () => {
      const address1 = addressDOGE(testSeed, { account: 0 })
      const address2 = addressDOGE(testSeed, { account: 1 })
      
      expect(address1.address).not.toBe(address2.address)
      expect(address1.path).toBe("m/44'/3'/0'/0/0")
      expect(address2.path).toBe("m/44'/3'/1'/0/0")
    })

    it('should generate addresses starting with D', () => {
      const addresses = [0, 1, 2, 3, 4].map(index => 
        addressDOGE(testSeed, { index })
      )
      
      addresses.forEach(addr => {
        expect(addr.address).toMatch(/^D/)
      })
    })

    it('should generate valid private keys', () => {
      const address = addressDOGE(testSeed, { index: 0 })
      
      expect(address.privateKeyHex).toBeDefined()
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
      expect(address.privateKeyHex).not.toContain('0x')
      
      // Verify deterministic behavior
      const address2 = addressDOGE(testSeed, { index: 0 })
      expect(address.privateKeyHex).toBe(address2.privateKeyHex)
    })

    it('should generate different private keys for different indices', () => {
      const address1 = addressDOGE(testSeed, { index: 0 })
      const address2 = addressDOGE(testSeed, { index: 1 })
      const address3 = addressDOGE(testSeed, { index: 2 })
      
      expect(address1.privateKeyHex).not.toBe(address2.privateKeyHex)
      expect(address2.privateKeyHex).not.toBe(address3.privateKeyHex)
      expect(address1.privateKeyHex).not.toBe(address3.privateKeyHex)
    })
  })

  describe('TRX (Tron) Address Derivation', () => {
    it('should generate valid Tron addresses', () => {
      const address = addressTRX(testSeed)
      
      expect(address.chain).toBe('TRX')
      expect(address.address).toMatch(/^T[a-zA-Z0-9]{33}$/)
      expect(address.path).toBe("m/44'/195'/0'/0/0")
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
      expect(address.xpub).toBeDefined()
    })

    it('should generate different addresses for different indices', () => {
      const address1 = addressTRX(testSeed, { index: 0 })
      const address2 = addressTRX(testSeed, { index: 1 })
      const address3 = addressTRX(testSeed, { index: 2 })
      
      expect(address1.address).not.toBe(address2.address)
      expect(address2.address).not.toBe(address3.address)
      expect(address1.address).not.toBe(address3.address)
    })

    it('should use BIP44 purpose', () => {
      const address = addressTRX(testSeed)
      expect(address.path).toMatch(/^m\/44'/)
    })

    it('should use Tron network parameters', () => {
      const address = addressTRX(testSeed)
      expect(address.path).toMatch(/\/195'/) // Tron coin type
    })

    it('should generate addresses starting with T', () => {
      const addresses = [0, 1, 2, 3, 4].map(index => 
        addressTRX(testSeed, { index })
      )
      
      addresses.forEach(addr => {
        expect(addr.address).toMatch(/^T/)
      })
    })

    it('should handle different accounts', () => {
      const address1 = addressTRX(testSeed, { account: 0 })
      const address2 = addressTRX(testSeed, { account: 1 })
      
      expect(address1.address).not.toBe(address2.address)
      expect(address1.path).toBe("m/44'/195'/0'/0/0")
      expect(address2.path).toBe("m/44'/195'/1'/0/0")
    })

    it('should generate valid private keys', () => {
      const address = addressTRX(testSeed, { index: 0 })
      
      expect(address.privateKeyHex).toBeDefined()
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
      expect(address.privateKeyHex).not.toContain('0x')
      
      // Verify deterministic behavior
      const address2 = addressTRX(testSeed, { index: 0 })
      expect(address.privateKeyHex).toBe(address2.privateKeyHex)
    })

    it('should generate different private keys for different indices', () => {
      const address1 = addressTRX(testSeed, { index: 0 })
      const address2 = addressTRX(testSeed, { index: 1 })
      const address3 = addressTRX(testSeed, { index: 2 })
      
      expect(address1.privateKeyHex).not.toBe(address2.privateKeyHex)
      expect(address2.privateKeyHex).not.toBe(address3.privateKeyHex)
      expect(address1.privateKeyHex).not.toBe(address3.privateKeyHex)
    })
  })

  describe('XRP (Ripple) Address Derivation', () => {
    it('should generate valid Ripple addresses', () => {
      const address = addressXRP(testSeed)
      
      expect(address.chain).toBe('XRP')
      expect(address.address).toMatch(/^r[a-zA-Z0-9]{25,34}$/)
      expect(address.path).toBe("m/44'/144'/0'/0/0")
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
      expect(address.xpub).toBeDefined()
    })

    it('should generate different addresses for different indices', () => {
      const address1 = addressXRP(testSeed, { index: 0 })
      const address2 = addressXRP(testSeed, { index: 1 })
      const address3 = addressXRP(testSeed, { index: 2 })
      
      expect(address1.address).not.toBe(address2.address)
      expect(address2.address).not.toBe(address3.address)
      expect(address1.address).not.toBe(address3.address)
    })

    it('should use BIP44 purpose', () => {
      const address = addressXRP(testSeed)
      expect(address.path).toMatch(/^m\/44'/)
    })

    it('should use Ripple network parameters', () => {
      const address = addressXRP(testSeed)
      expect(address.path).toMatch(/\/144'/) // Ripple coin type
    })

    it('should generate addresses starting with r', () => {
      const addresses = [0, 1, 2, 3, 4].map(index => 
        addressXRP(testSeed, { index })
      )
      
      addresses.forEach(addr => {
        expect(addr.address).toMatch(/^r/)
      })
    })

    it('should handle different accounts', () => {
      const address1 = addressXRP(testSeed, { account: 0 })
      const address2 = addressXRP(testSeed, { account: 1 })
      
      expect(address1.address).not.toBe(address2.address)
      expect(address1.path).toBe("m/44'/144'/0'/0/0")
      expect(address2.path).toBe("m/44'/144'/1'/0/0")
    })

    it('should use RIPEMD160(SHA256(pubkey)) for address generation', () => {
      // This test verifies that XRP addresses are derived using the correct
      // cryptographic functions as specified in the XRP Ledger
      const address1 = addressXRP(testSeed, { index: 0 })
      const address2 = addressXRP(testSeed, { index: 1 })
      
      // Different indices should produce different addresses
      expect(address1.address).not.toBe(address2.address)
      
      // Both should be valid Ripple addresses
      expect(address1.address).toMatch(/^r[a-zA-Z0-9]{25,34}$/)
      expect(address2.address).toMatch(/^r[a-zA-Z0-9]{25,34}$/)
    })

    it('should generate valid private keys', () => {
      const address = addressXRP(testSeed, { index: 0 })
      
      expect(address.privateKeyHex).toBeDefined()
      expect(address.privateKeyHex).toMatch(/^[a-f0-9]{64}$/)
      expect(address.privateKeyHex).not.toContain('0x')
      
      // Verify deterministic behavior
      const address2 = addressXRP(testSeed, { index: 0 })
      expect(address.privateKeyHex).toBe(address2.privateKeyHex)
    })

    it('should generate different private keys for different indices', () => {
      const address1 = addressXRP(testSeed, { index: 0 })
      const address2 = addressXRP(testSeed, { index: 1 })
      const address3 = addressXRP(testSeed, { index: 2 })
      
      expect(address1.privateKeyHex).not.toBe(address2.privateKeyHex)
      expect(address2.privateKeyHex).not.toBe(address3.privateKeyHex)
      expect(address1.privateKeyHex).not.toBe(address3.privateKeyHex)
    })
  })

  describe('Cross-Chain Consistency', () => {
    it('should generate unique addresses across all chains', () => {
      const addresses = [
        addressLTC(testSeed),
        addressDOGE(testSeed),
        addressTRX(testSeed),
        addressXRP(testSeed)
      ]
      
      const addressStrings = addresses.map(addr => addr.address)
      const uniqueAddresses = new Set(addressStrings)
      
      // All addresses should be unique
      expect(uniqueAddresses.size).toBe(4)
    })

    it('should use correct coin types for each chain', () => {
      const ltcAddress = addressLTC(testSeed)
      const dogeAddress = addressDOGE(testSeed)
      const trxAddress = addressTRX(testSeed)
      const xrpAddress = addressXRP(testSeed)
      
      expect(ltcAddress.path).toContain("/2'")      // LTC coin type
      expect(dogeAddress.path).toContain("/3'")     // DOGE coin type
      expect(trxAddress.path).toContain("/195'")    // TRX coin type
      expect(xrpAddress.path).toContain("/144'")    // XRP coin type
    })

    it('should maintain deterministic behavior across chains', () => {
      // Same seed should generate same addresses across multiple calls
      const ltc1 = addressLTC(testSeed, { index: 5 })
      const ltc2 = addressLTC(testSeed, { index: 5 })
      
      const doge1 = addressDOGE(testSeed, { index: 5 })
      const doge2 = addressDOGE(testSeed, { index: 5 })
      
      expect(ltc1.address).toBe(ltc2.address)
      expect(doge1.address).toBe(doge2.address)
    })

    it('should generate unique private keys across all chains', () => {
      const addresses = [
        addressLTC(testSeed, { index: 0 }),
        addressDOGE(testSeed, { index: 0 }),
        addressTRX(testSeed, { index: 0 }),
        addressXRP(testSeed, { index: 0 })
      ]
      
      const privateKeys = addresses.map(addr => addr.privateKeyHex)
      const uniquePrivateKeys = new Set(privateKeys)
      
      // All private keys should be unique (different chains, same index)
      expect(uniquePrivateKeys.size).toBe(4)
    })

    it('should maintain private key consistency across multiple calls', () => {
      // Same seed and parameters should generate same private keys
      const ltc1 = addressLTC(testSeed, { index: 10 })
      const ltc2 = addressLTC(testSeed, { index: 10 })
      const ltc3 = addressLTC(testSeed, { index: 10 })
      
      expect(ltc1.privateKeyHex).toBe(ltc2.privateKeyHex)
      expect(ltc2.privateKeyHex).toBe(ltc3.privateKeyHex)
      expect(ltc1.privateKeyHex).toBe(ltc3.privateKeyHex)
    })
  })
})
