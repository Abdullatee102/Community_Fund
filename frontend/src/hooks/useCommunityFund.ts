import { useEffect } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import {
  useAccount,
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { zeroAddress, type Address, type Hash } from 'viem'

import communityFundAbi from '../abi/CommunityFund.json'
import communityFundFactoryAbi from '../abi/CommunityFundFactory.json'

import {
  botTestnet,
  communityFundAddress,
  communityFundFactoryAddress,
} from '../config/chains'

/*
 * The original deployed CommunityFund remains the legacy/default fund.
 * New funds created through the factory can be passed into useFund(fundAddress).
 */
const defaultFundAddress = communityFundAddress ?? zeroAddress
const defaultFundEnabled = Boolean(communityFundAddress)

const factoryReadAddress = communityFundFactoryAddress ?? zeroAddress
const factoryReadEnabled = Boolean(communityFundFactoryAddress)

/* -------------------------------------------------------------------------- */
/*                              FACTORY READS                                 */
/* -------------------------------------------------------------------------- */

export function useFunds() {
  return useReadContract({
    address: factoryReadAddress,
    abi: communityFundFactoryAbi,
    functionName: 'getFunds',
    query: {
      enabled: factoryReadEnabled,
    },
  })
}

export function useFundsByCreator(creator?: Address) {
  return useReadContract({
    address: factoryReadAddress,
    abi: communityFundFactoryAbi,
    functionName: 'getFundsByCreator',
    args: [creator ?? zeroAddress],
    query: {
      enabled: factoryReadEnabled && Boolean(creator),
    },
  })
}

export function useFundCount() {
  return useReadContract({
    address: factoryReadAddress,
    abi: communityFundFactoryAbi,
    functionName: 'fundCount',
    query: {
      enabled: factoryReadEnabled,
    },
  })
}

/* -------------------------------------------------------------------------- */
/*                              FUND READS                                    */
/* -------------------------------------------------------------------------- */

export function useFund(fundAddress?: Address) {
  const selectedAddress = fundAddress ?? defaultFundAddress
  const selectedEnabled = fundAddress
    ? true
    : defaultFundEnabled

  const title = useReadContract({
    address: selectedAddress,
    abi: communityFundAbi,
    functionName: 'title',
    query: {
      enabled: selectedEnabled,
    },
  })

  const metadataUri = useReadContract({
    address: selectedAddress,
    abi: communityFundAbi,
    functionName: 'metadataUri',
    query: {
      enabled: selectedEnabled,
    },
  })

  const target = useReadContract({
    address: selectedAddress,
    abi: communityFundAbi,
    functionName: 'fundingTarget',
    query: {
      enabled: selectedEnabled,
    },
  })

  const deadline = useReadContract({
    address: selectedAddress,
    abi: communityFundAbi,
    functionName: 'fundingDeadline',
    query: {
      enabled: selectedEnabled,
    },
  })

  const raised = useReadContract({
    address: selectedAddress,
    abi: communityFundAbi,
    functionName: 'amountRaised',
    query: {
      enabled: selectedEnabled,
    },
  })

  const contributors = useReadContract({
    address: selectedAddress,
    abi: communityFundAbi,
    functionName: 'contributorCount',
    query: {
      enabled: selectedEnabled,
    },
  })

  const status = useReadContract({
    address: selectedAddress,
    abi: communityFundAbi,
    functionName: 'status',
    query: {
      enabled: selectedEnabled,
    },
  })

  const requiredApprovals = useReadContract({
    address: selectedAddress,
    abi: communityFundAbi,
    functionName: 'requiredApprovals',
    query: {
      enabled: selectedEnabled,
    },
  })

  return {
    address: fundAddress ?? communityFundAddress,

    title: title.data,
    metadataUri: metadataUri.data,
    target: target.data,
    deadline: deadline.data,
    raised: raised.data,
    contributors: contributors.data,
    status: status.data,
    requiredApprovals: requiredApprovals.data,

    isLoading: [
      title,
      metadataUri,
      target,
      deadline,
      raised,
      contributors,
      status,
      requiredApprovals,
    ].some((item) => item.isLoading),

    isError: [
      title,
      metadataUri,
      target,
      deadline,
      raised,
      contributors,
      status,
      requiredApprovals,
    ].some((item) => item.isError),

    isConfigured: selectedEnabled,
  }
}

export function useContributor(
  address?: Address,
  fundAddress?: Address,
) {
  const selectedAddress = fundAddress ?? defaultFundAddress
  const selectedEnabled = fundAddress
    ? true
    : defaultFundEnabled

  return useReadContract({
    address: selectedAddress,
    abi: communityFundAbi,
    functionName: 'contributions',
    args: [address ?? zeroAddress],
    query: {
      enabled: selectedEnabled && Boolean(address),
    },
  })
}

export function useFundContributions(fundAddress?: Address) {
  const selectedAddress = fundAddress ?? defaultFundAddress
  const selectedEnabled = fundAddress
    ? true
    : defaultFundEnabled

  return useReadContract({
    address: selectedAddress,
    abi: communityFundAbi,
    functionName: 'getContributors',
    query: {
      enabled: selectedEnabled,
    },
  })
}

export function useSpendingRequests(
  requestId: bigint,
  fundAddress?: Address,
) {
  const selectedAddress = fundAddress ?? defaultFundAddress
  const selectedEnabled = fundAddress
    ? true
    : defaultFundEnabled

  return useReadContract({
    address: selectedAddress,
    abi: communityFundAbi,
    functionName: 'getSpendingRequest',
    args: [requestId],
    query: {
      enabled: selectedEnabled,
    },
  })
}

export function useApprovalStatus(
  requestId: bigint,
  address?: Address,
  fundAddress?: Address,
) {
  const selectedAddress = fundAddress ?? defaultFundAddress
  const selectedEnabled = fundAddress
    ? true
    : defaultFundEnabled

  return useReadContract({
    address: selectedAddress,
    abi: communityFundAbi,
    functionName: 'approvals',
    args: [requestId, address ?? zeroAddress],
    query: {
      enabled: selectedEnabled && Boolean(address),
    },
  })
}

export function useCampaignStatus(fundAddress?: Address) {
  const selectedAddress = fundAddress ?? defaultFundAddress
  const selectedEnabled = fundAddress
    ? true
    : defaultFundEnabled

  return useReadContract({
    address: selectedAddress,
    abi: communityFundAbi,
    functionName: 'status',
    query: {
      enabled: selectedEnabled,
    },
  })
}

/* -------------------------------------------------------------------------- */
/*                              FUND WRITES                                   */
/* -------------------------------------------------------------------------- */

function useFundWrite(fundAddress?: Address) {
  const queryClient = useQueryClient()

  const write = useWriteContract()

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  })

  useEffect(() => {
    if (receipt.isSuccess) {
      void queryClient.invalidateQueries()
    }
  }, [queryClient, receipt.isSuccess])

  const submit = (
    functionName: string,
    args: readonly unknown[] = [],
    value?: bigint,
  ) => {
    const selectedAddress = fundAddress ?? communityFundAddress

    if (!selectedAddress) {
      return
    }

    write.writeContract({
      address: selectedAddress,
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

/* -------------------------------------------------------------------------- */
/*                            FACTORY CREATE                                  */
/* -------------------------------------------------------------------------- */

export function useCreateFund() {
  const queryClient = useQueryClient()

  const write = useWriteContract()

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  })

  useEffect(() => {
    if (receipt.isSuccess) {
      void queryClient.invalidateQueries()
    }
  }, [queryClient, receipt.isSuccess])

  const createFund = (
    title: string,
    metadataUri: string,
    fundingTarget: bigint,
    fundingDeadline: bigint,
  ) => {
    if (!communityFundFactoryAddress) {
      return
    }

    write.writeContract({
      address: communityFundFactoryAddress,
      abi: communityFundFactoryAbi,
      functionName: 'createFund',
      args: [
        title,
        metadataUri,
        fundingTarget,
        fundingDeadline,
      ],
    } as never)
  }

  return {
    createFund,

    hash: write.data as Hash | undefined,

    isPending: write.isPending,
    isConfirming: receipt.isLoading,
    isConfirmed: receipt.isSuccess,

    error: write.error || receipt.error,

    reset: write.reset,

    isConfigured: Boolean(communityFundFactoryAddress),
  }
}

/* -------------------------------------------------------------------------- */
/*                            FUND ACTIONS                                    */
/* -------------------------------------------------------------------------- */

export function useContribute(fundAddress?: Address) {
  const action = useFundWrite(fundAddress)

  return {
    ...action,

    contribute: (amount: bigint) =>
      action.submit('contribute', [], amount),
  }
}

export function useCreateSpendingRequest(
  fundAddress?: Address,
) {
  const action = useFundWrite(fundAddress)

  return {
    ...action,

    createSpendingRequest: (
      recipient: Address,
      amount: bigint,
      metadataUri: string,
    ) =>
      action.submit(
        'createSpendingRequest',
        [recipient, amount, metadataUri],
      ),
  }
}

export function useApproveSpendingRequest(
  fundAddress?: Address,
) {
  const action = useFundWrite(fundAddress)

  return {
    ...action,

    approveSpendingRequest: (requestId: bigint) =>
      action.submit(
        'approveSpendingRequest',
        [requestId],
      ),
  }
}

export function useExecuteSpendingRequest(
  fundAddress?: Address,
) {
  const action = useFundWrite(fundAddress)

  return {
    ...action,

    executeSpendingRequest: (requestId: bigint) =>
      action.submit(
        'executeSpendingRequest',
        [requestId],
      ),
  }
}

export function useClaimRefund(fundAddress?: Address) {
  const action = useFundWrite(fundAddress)

  return {
    ...action,

    claimRefund: () =>
      action.submit('claimRefund'),
  }
}

/* -------------------------------------------------------------------------- */
/*                            WALLET READINESS                                */
/* -------------------------------------------------------------------------- */

export function useWalletReadiness() {
  const { address, isConnected } = useAccount()

  const chainId = useChainId()

  return {
    address,
    isConnected,

    isCorrectNetwork:
      chainId === botTestnet.id,

    hasContract:
      Boolean(communityFundAddress) ||
      Boolean(communityFundFactoryAddress),

    hasFundContract:
      Boolean(communityFundAddress),

    hasFactoryContract:
      Boolean(communityFundFactoryAddress),
  }
}