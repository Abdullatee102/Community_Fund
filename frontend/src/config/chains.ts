import { defineChain, isAddress, type Address } from 'viem'

const botRpcUrl = import.meta.env.VITE_BOT_RPC_URL || 'https://rpc.bohr.life'
const botChainId = Number(import.meta.env.VITE_BOT_CHAIN_ID || 968)

if (botChainId !== 968) {
  throw new Error('VITE_BOT_CHAIN_ID must be 968 for Bohr Testnet')
}

export const botTestnet = defineChain({
  id: 968,
  name: 'Bohr Testnet',
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
      name: 'Bohr Scan',
      url: import.meta.env.VITE_BOT_EXPLORER_URL || 'https://scan.bohr.life/',
    },
  },
})

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