import { describe, it, expect, beforeAll } from 'vitest'
import { mnemonicToSeed, deriveXPubForChain, deriveWatchOnlyAddress, deriveAddressForChain } from '../src/index.js'
import type { Chain } from '../src/types.js'

const CHAINS: Chain[] = ['BTC','LTC','DOGE','ETH','BSC','TRX','XRP']

/**
 * Integration: given a mnemonic, for each chain derive xpub at change level and then
 * derive multiple addresses from that xpub; compare with seed-derived addresses.
 */
describe('XPUB integration: seed -> xpub -> addresses matches seed -> addresses', () => {
  let seed: Buffer
  const mnemonic = 'winner side noodle ahead another aware upper copy produce radar enough capital flame series photo economy sock casual input exotic hollow record leg champion'

  beforeAll(async () => {
    seed = await mnemonicToSeed(mnemonic)
  })

  it('matches for indices 0..5 across chains', () => {
    for (const chain of CHAINS) {
      // Derive xpub anchored at change level via index=0 (helper extracts parent)
      const { xpub } = deriveXPubForChain(chain, seed, { account: 0, change: 0, index: 0 })
      expect(xpub).toBeDefined()
      expect(xpub!.startsWith('xpub')).toBe(true)

      for (let i = 0; i <= 5; i++) {
        const direct = deriveAddressForChain(chain, seed, { account: 0, change: 0, index: i })
        const watch = deriveWatchOnlyAddress(chain, xpub!, 0, i)
        expect(watch.address).toBe(direct.address)
      }
    }
  })

  it('BTC change branch parity: change=1 also matches', () => {
    const { xpub } = deriveXPubForChain('BTC', seed, { account: 0, change: 1, index: 0 })
    for (let i = 0; i <= 3; i++) {
      const direct = deriveAddressForChain('BTC', seed, { account: 0, change: 1, index: i })
      const watch = deriveWatchOnlyAddress('BTC', xpub!, 1, i)
      expect(watch.address).toBe(direct.address)
    }
  })
})
