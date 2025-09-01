export type Chain =
  | 'BTC'
  | 'ETH'
  | 'BSC'
  | 'DOGE'
  | 'LTC'
  | 'TRX'
  | 'XRP'
  | 'SOL'

export interface DeriveOpts {
  /** account number (hardened) */
  account?: number
  /** 0 = external, 1 = internal/change */
  change?: 0 | 1
  /** address index */
  index?: number
  /** override full derivation path (advanced) */
  customPath?: string
}

export interface DerivedAddress {
  chain: Chain
  path: string
  address: string
  /** hex without 0x unless noted */
  privateKeyHex?: string
  /** array format private key for Solana alternative import */
  privateKeyArray?: number[]
  /** optional base58 xpub for UTXO/EVM chains where applicable */
  xpub?: string
}
