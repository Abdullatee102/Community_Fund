import { defineChain, isAddress, type Address } from 'viem'

const botRpcUrl = import.meta.env.VITE_BOT_RPC_URL || 'https://rpc.botchain.ai'
const botChainId = Number(import.meta.env.VITE_BOT_CHAIN_ID || 677)

if (botChainId !== 677) {
  throw new Error('VITE_BOT_CHAIN_ID must be 677 for BotChain Mainnet')
}

export const botMainnet = defineChain({
  id: 677,
  name: 'BotChain Mainnet',
  nativeCurrency: {
    name: 'BOT',
    symbol: 'BOT',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [botRpcUrl] },
  },
  blockExplorers: {
    default: {
      name: 'BotChain Scan',
      url: import.meta.env.VITE_BOT_EXPLORER_URL || 'https://scan.botchain.ai/',
    },
  },
})

// Backward-compatible alias
export const botTestnet = botMainnet

const configuredFundAddress =
  import.meta.env.VITE_COMMUNITY_FUND_CONTRACT_ADDRESS

export const communityFundAddress: Address | undefined =
  isAddress(configuredFundAddress || '')
    ? configuredFundAddress
    : undefined

const configuredFactoryAddress =
  import.meta.env.VITE_COMMUNITY_FUND_FACTORY_ADDRESS

export const communityFundFactoryAddress: Address | undefined =
  isAddress(configuredFactoryAddress || '')
    ? configuredFactoryAddress
    : undefined
