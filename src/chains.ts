export const SLIP44 = {
  BTC: 0,
  ETH: 60,
  BSC: 60,
  DOGE: 3,
  LTC: 2,
  TRX: 195,
  XRP: 144,
  SOL: 501
} as const

// Default purposes per chain (you can change to 44'/49'/84' for BTC/LTC)
export const DEFAULT_PURPOSE = {
  BTC: 84,  // bech32 P2WPKH
  LTC: 84,  // bech32 P2WPKH
  DOGE: 44, // legacy P2PKH
  ETH: 44,
  BSC: 44,
  TRX: 44,
  XRP: 44,
  SOL: 44   // SLIP-0010 ed25519
} as const

// Testnet network configurations
export const TESTNET_NETWORKS = {
  BTC: 'testnet',
  LTC: 'testnet',
  DOGE: 'testnet',
  ETH: 'sepolia', // or 'goerli'
  BSC: 'testnet',
  TRX: 'shasta',
  XRP: 'testnet',
  SOL: 'devnet'
} as const
