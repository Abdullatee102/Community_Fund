import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { zeroAddress, type Address, type Hash } from 'viem'
import communityFundAbi from '../abi/CommunityFund.json'
import { botTestnet, communityFundAddress } from '../config/chains'

const readAddress = communityFundAddress ?? zeroAddress
const readEnabled = Boolean(communityFundAddress)

export function useFund() {
  const title = useReadContract({ address: readAddress, abi: communityFundAbi, functionName: 'title', query: { enabled: readEnabled } })
  const metadataUri = useReadContract({ address: readAddress, abi: communityFundAbi, functionName: 'metadataUri', query: { enabled: readEnabled } })
  const target = useReadContract({ address: readAddress, abi: communityFundAbi, functionName: 'fundingTarget', query: { enabled: readEnabled } })
  const deadline = useReadContract({ address: readAddress, abi: communityFundAbi, functionName: 'fundingDeadline', query: { enabled: readEnabled } })
  const raised = useReadContract({ address: readAddress, abi: communityFundAbi, functionName: 'amountRaised', query: { enabled: readEnabled } })
  const contributors = useReadContract({ address: readAddress, abi: communityFundAbi, functionName: 'contributorCount', query: { enabled: readEnabled } })
  const status = useReadContract({ address: readAddress, abi: communityFundAbi, functionName: 'status', query: { enabled: readEnabled } })
  const requiredApprovals = useReadContract({ address: readAddress, abi: communityFundAbi, functionName: 'requiredApprovals', query: { enabled: readEnabled } })

  return {
    title: title.data,
    metadataUri: metadataUri.data,
    target: target.data,
    deadline: deadline.data,
    raised: raised.data,
    contributors: contributors.data,
    status: status.data,
    requiredApprovals: requiredApprovals.data,
    isLoading: [title, metadataUri, target, deadline, raised, contributors, status, requiredApprovals].some((item) => item.isLoading),
    isError: [title, metadataUri, target, deadline, raised, contributors, status, requiredApprovals].some((item) => item.isError),
    isConfigured: readEnabled,
  }
}

export function useContributor(address?: Address) {
  return useReadContract({
    address: readAddress,
    abi: communityFundAbi,
    functionName: 'contributions',
    args: [address ?? zeroAddress],
    query: { enabled: readEnabled && Boolean(address) },
  })
}

export function useFundContributions() {
  return useReadContract({ address: readAddress, abi: communityFundAbi, functionName: 'getContributors', query: { enabled: readEnabled } })
}

export function useSpendingRequests(requestId: bigint) {
  return useReadContract({
    address: readAddress,
    abi: communityFundAbi,
    functionName: 'getSpendingRequest',
    args: [requestId],
    query: { enabled: readEnabled },
  })
}

export function useApprovalStatus(requestId: bigint, address?: Address) {
  return useReadContract({
    address: readAddress,
    abi: communityFundAbi,
    functionName: 'approvals',
    args: [requestId, address ?? zeroAddress],
    query: { enabled: readEnabled && Boolean(address) },
  })
}

export function useCampaignStatus() {
  return useReadContract({ address: readAddress, abi: communityFundAbi, functionName: 'status', query: { enabled: readEnabled } })
}

function useFundWrite() {
  const write = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash: write.data })

  const submit = (functionName: string, args: readonly unknown[] = [], value?: bigint) => {
    if (!communityFundAddress) return
    write.writeContract({
      address: communityFundAddress,
      abi: communityFundAbi,
      functionName: functionName as never,
      args: args as never,
      ...(value === undefined ? {} : { value }),
    } as never)
  }

  return {
    submit,
    hash: write.data as Hash | undefined,
    isPending: write.isPending,
    isConfirming: receipt.isLoading,
    isConfirmed: receipt.isSuccess,
    error: write.error || receipt.error,
    reset: write.reset,
  }
}

export function useCreateFund() {
  return useFundWrite()
}

export function useContribute() {
  const action = useFundWrite()
  return { ...action, contribute: (amount: bigint) => action.submit('contribute', [], amount) }
}

export function useCreateSpendingRequest() {
  const action = useFundWrite()
  return { ...action, createSpendingRequest: (recipient: Address, amount: bigint, metadataUri: string) => action.submit('createSpendingRequest', [recipient, amount, metadataUri]) }
}

export function useApproveSpendingRequest() {
  const action = useFundWrite()
  return { ...action, approveSpendingRequest: (requestId: bigint) => action.submit('approveSpendingRequest', [requestId]) }
}

export function useExecuteSpendingRequest() {
  const action = useFundWrite()
  return { ...action, executeSpendingRequest: (requestId: bigint) => action.submit('executeSpendingRequest', [requestId]) }
}

export function useClaimRefund() {
  const action = useFundWrite()
  return { ...action, claimRefund: () => action.submit('claimRefund') }
}

export function useWalletReadiness() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  return {
    address,
    isConnected,
    isCorrectNetwork: chainId === botTestnet.id,
    hasContract: readEnabled,
  }
}