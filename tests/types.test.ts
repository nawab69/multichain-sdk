import { describe, it, expect } from 'vitest'
import { Chain, DeriveOpts, DerivedAddress } from '../src/types.js'
import { SLIP44, DEFAULT_PURPOSE } from '../src/chains.js'

describe('Types and Constants', () => {
  describe('Chain type', () => {
    it('should have all expected chain values', () => {
      const expectedChains: Chain[] = ['BTC', 'ETH', 'BSC', 'DOGE', 'LTC', 'TRX', 'XRP', 'SOL']
      expect(expectedChains).toHaveLength(8)
      
      // Test that each chain is a valid Chain type
      expectedChains.forEach(chain => {
        expect(typeof chain).toBe('string')
        expect(chain).toMatch(/^(BTC|ETH|BSC|DOGE|LTC|TRX|XRP|SOL)$/)
      })
    })
  })

  describe('SLIP44 constants', () => {
    it('should have correct coin type values', () => {
      expect(SLIP44.BTC).toBe(0)
      expect(SLIP44.ETH).toBe(60)
      expect(SLIP44.BSC).toBe(60)
      expect(SLIP44.DOGE).toBe(3)
      expect(SLIP44.LTC).toBe(2)
      expect(SLIP44.TRX).toBe(195)
      expect(SLIP44.XRP).toBe(144)
      expect(SLIP44.SOL).toBe(501)
    })

    it('should have correct values', () => {
      expect(SLIP44.BTC).toBe(0)
      expect(SLIP44.ETH).toBe(60)
      expect(SLIP44.SOL).toBe(501)
    })
  })

  describe('DEFAULT_PURPOSE constants', () => {
    it('should have correct purpose values', () => {
      expect(DEFAULT_PURPOSE.BTC).toBe(84)  // bech32 P2WPKH
      expect(DEFAULT_PURPOSE.LTC).toBe(84)  // bech32 P2WPKH
      expect(DEFAULT_PURPOSE.DOGE).toBe(44) // legacy P2PKH
      expect(DEFAULT_PURPOSE.ETH).toBe(44)  // BIP44
      expect(DEFAULT_PURPOSE.BSC).toBe(44)  // BIP44
      expect(DEFAULT_PURPOSE.TRX).toBe(44)  // BIP44
      expect(DEFAULT_PURPOSE.XRP).toBe(44)  // BIP44
      expect(DEFAULT_PURPOSE.SOL).toBe(44)  // SLIP-0010
    })

    it('should have correct values', () => {
      expect(DEFAULT_PURPOSE.BTC).toBe(84)
      expect(DEFAULT_PURPOSE.ETH).toBe(44)
      expect(DEFAULT_PURPOSE.SOL).toBe(44)
    })
  })

  describe('DeriveOpts interface', () => {
    it('should allow all optional properties', () => {
      const opts: DeriveOpts = {
        account: 1,
        change: 1,
        index: 5,
        customPath: "m/44'/60'/1'/1/5"
      }
      
      expect(opts.account).toBe(1)
      expect(opts.change).toBe(1)
      expect(opts.index).toBe(5)
      expect(opts.customPath).toBe("m/44'/60'/1'/1/5")
    })

    it('should allow partial options', () => {
      const partialOpts: DeriveOpts = {
        index: 10
      }
      
      expect(partialOpts.index).toBe(10)
      expect(partialOpts.account).toBeUndefined()
      expect(partialOpts.change).toBeUndefined()
      expect(partialOpts.customPath).toBeUndefined()
    })

    it('should allow empty options', () => {
      const emptyOpts: DeriveOpts = {}
      expect(emptyOpts).toEqual({})
    })
  })

  describe('DerivedAddress interface', () => {
    it('should have required properties', () => {
      const address: DerivedAddress = {
        chain: 'BTC',
        path: "m/84'/0'/0'/0/0",
        address: 'bc1q...',
        privateKeyHex: 'abcd1234...',
        xpub: 'xpub...'
      }
      
      expect(address.chain).toBe('BTC')
      expect(address.path).toBe("m/84'/0'/0'/0/0")
      expect(address.address).toBe('bc1q...')
      expect(address.privateKeyHex).toBe('abcd1234...')
      expect(address.xpub).toBe('xpub...')
    })

    it('should allow optional properties to be undefined', () => {
      const address: DerivedAddress = {
        chain: 'SOL',
        path: "m/44'/501'/0'",
        address: '1111...'
      }
      
      expect(address.privateKeyHex).toBeUndefined()
      expect(address.xpub).toBeUndefined()
    })
  })
})
