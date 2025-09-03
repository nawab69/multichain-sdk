import { describe, it, expect, beforeAll } from 'vitest'
import { mnemonicToSeed, deriveAddressForChain, deriveXPubForChain, deriveWatchOnlyAddress } from '../src/index.js'
import type { Chain } from '../src/types.js'

const CHAINS: Chain[] = ['BTC','LTC','DOGE','ETH','BSC','TRX','XRP']

describe('XPUB: derivation and watch-only matching', () => {
  let seed: Buffer
  const mnemonic = 'winner side noodle ahead another aware upper copy produce radar enough capital flame series photo economy sock casual input exotic hollow record leg champion'

  beforeAll(async () => {
    seed = await mnemonicToSeed(mnemonic)
  })

  it('derives secure xpubs (no private keys exposed)', () => {
    for (const chain of CHAINS) {
      const { xpub } = deriveXPubForChain(chain, seed, { account: 0, change: 0, index: 0 })
      expect(xpub).toBeDefined()
      expect(xpub!.startsWith('xpub')).toBe(true)
    }
  })

  it('watch-only addresses from xpub match seed-derived addresses (indices 0..2)', () => {
    for (const chain of CHAINS) {
      for (let i = 0; i <= 2; i++) {
        const direct = deriveAddressForChain(chain, seed, { account: 0, change: 0, index: i })
        const { xpub } = deriveXPubForChain(chain, seed, { account: 0, change: 0, index: i })
        const watch = deriveWatchOnlyAddress(chain, xpub!, 0, i)
        expect(watch.address).toBe(direct.address)
      }
    }
  })

  it('BTC handles change 0 and 1 consistently', () => {
    for (let change of [0, 1] as const) {
      for (let i = 0; i <= 1; i++) {
        const direct = deriveAddressForChain('BTC', seed, { account: 0, change, index: i })
        const { xpub } = deriveXPubForChain('BTC', seed, { account: 0, change, index: i })
        const watch = deriveWatchOnlyAddress('BTC', xpub!, change, i)
        expect(watch.address).toBe(direct.address)
      }
    }
  })

  it('ETH matches EIP-55 checksummed addresses from xpub', () => {
    for (let i = 0; i <= 2; i++) {
      const direct = deriveAddressForChain('ETH', seed, { account: 0, change: 0, index: i })
      const { xpub } = deriveXPubForChain('ETH', seed, { account: 0, change: 0, index: i })
      const watch = deriveWatchOnlyAddress('ETH', xpub!, 0, i)
      expect(watch.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(watch.address).toBe(direct.address)
    }
  })
})
