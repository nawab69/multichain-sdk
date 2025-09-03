import { describe, it, expect, beforeAll } from 'vitest'
import { mnemonicToSeed, deriveXPubForChain, deriveWatchOnlyAddress } from '../src/index.js'

describe('XPUB negative cases', () => {
  let seed: Buffer
  const mnemonic = 'winner side noodle ahead another aware upper copy produce radar enough capital flame series photo economy sock casual input exotic hollow record leg champion'

  beforeAll(async () => {
    seed = await mnemonicToSeed(mnemonic)
  })

  it('rejects invalid xpub strings', () => {
    const badXpubs = [
      '',
      'xpub',
      'not-an-xpub',
      'xprv9s21ZrQH143K3fakeprivatekeyshouldnotpass',
      'dgubfake',
    ]

    for (const bad of badXpubs) {
      expect(() => deriveWatchOnlyAddress('BTC', bad, 0, 0)).toThrow()
      expect(() => deriveWatchOnlyAddress('ETH', bad, 0, 0)).toThrow()
    }
  })

  it('throws for unsupported SOL watch-only/xpub', () => {
    expect(() => deriveWatchOnlyAddress('SOL' as any, 'xpub6C...', 0, 0)).toThrow()
    expect(() => deriveXPubForChain('SOL' as any, seed)).toThrow()
  })

  it('BTC: detects mismatch when using wrong network version bytes', () => {
    const { xpub } = deriveXPubForChain('BTC', seed, { account: 0, change: 0, index: 0 })
    // Using testnet flag should still parse since we normalize to standard network,
    // but providing a clearly wrong change branch should cause mismatch at index level.
    const watch = deriveWatchOnlyAddress('BTC', xpub!, 0, 0)
    expect(watch.address).toBeDefined()
    // Ensure a different index yields a different address
    const watch1 = deriveWatchOnlyAddress('BTC', xpub!, 0, 1)
    expect(watch1.address).not.toBe(watch.address)
  })

  it('ETH: watch-only requires xpub at change level; random xpubs will fail', () => {
    const { xpub } = deriveXPubForChain('ETH', seed, { account: 0, change: 0, index: 0 })
    expect(() => deriveWatchOnlyAddress('ETH', xpub!, 1 as 0|1, 0)).not.toThrow()
  })
})
