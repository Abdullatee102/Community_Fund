import { QueryClient } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { botTestnet } from './chains'

export const queryClient = new QueryClient()

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID
export const hasReownProjectId = Boolean(projectId)

if (!projectId) {
  console.warn('VITE_REOWN_PROJECT_ID is missing. Wallet connection is disabled until it is provided.')
}

export const wagmiAdapter = new WagmiAdapter({
  networks: [botTestnet],
  projectId: projectId || 'missing-reown-project-id',
})

export const wagmiConfig = wagmiAdapter.wagmiConfig

if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    networks: [botTestnet],
    projectId,
    metadata: {
      name: 'BotCommunityFund',
      description: 'Transparent community funding on Bohr Testnet',
      url: window.location.origin,
      icons: [`${window.location.origin}/favicon.svg`],
    },
    features: {
      analytics: false,
    },
  })
}
