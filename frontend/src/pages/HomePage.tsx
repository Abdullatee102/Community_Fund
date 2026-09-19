import { useMemo, useState } from 'react'
import {
  formatEther,
  isAddress,
  parseEther,
  type Address,
} from 'viem'
import {
  useAccount,
  useReadContract,
} from 'wagmi'

import communityFundAbi from '../abi/CommunityFund.json'

import {
  useApprovalStatus,
  useApproveSpendingRequest,
  useClaimRefund,
  useContribute,
  useCreateFund,
  useCreateSpendingRequest,
  useExecuteSpendingRequest,
  useFund,
  useFunds,
  useSpendingRequests,
  useWalletReadiness,
} from '../hooks/useCommunityFund'

import {
  communityFundAddress,
} from '../config/chains'

const statuses = [
  'Funding',
  'Funded',
  'Failed',
  'Completed',
  'Cancelled',
] as const

function formatBot(value: unknown) {
  return typeof value === 'bigint'
    ? `${formatEther(value)} BOT`
    : '— BOT'
}

function formatDeadline(value: unknown) {
  return typeof value === 'bigint'
    ? new Date(Number(value) * 1000).toLocaleDateString()
    : '—'
}

function formatPurpose(value: unknown) {
  if (
    typeof value !== 'string' ||
    value.startsWith('ipfs://replace-with-')
  ) {
    return 'Shared community project with transparent on-chain funding.'
  }

  return value
}

function explainError(error: Error | null) {
  if (!error) return ''

  const message = error.message.toLowerCase()

  if (
    message.includes('user rejected') ||
    message.includes('rejected')
  ) {
    return 'The wallet rejected this transaction.'
  }

  if (message.includes('insufficient funds')) {
    return 'Your wallet does not have enough BOT for this transaction.'
  }

  if (
    message.includes('wrong network') ||
    message.includes('chain')
  ) {
    return 'Switch your wallet to Bohr Testnet (chain 968).'
  }

  return 'The transaction could not be completed. Check the project state and try again.'
}

function HomePage() {
  const { address } = useAccount()

  const readiness = useWalletReadiness()

  const fundsQuery = useFunds()

  const createFund = useCreateFund()

  const [selectedFund, setSelectedFund] = useState<Address | undefined>(
    communityFundAddress,
  )

  const [amount, setAmount] = useState('')
  const [notice, setNotice] = useState('')

  const [showCreateForm, setShowCreateForm] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newMetadataUri, setNewMetadataUri] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [newDeadlineDays, setNewDeadlineDays] = useState('7')

  /*
   * The factory only knows about funds created through the factory.
   * The original deployed fund is therefore kept separately as a legacy fund.
   */
  const factoryFunds = useMemo(() => {
    if (!Array.isArray(fundsQuery.data)) {
      return [] as Address[]
    }

    return fundsQuery.data.filter(
      (fund): fund is Address => typeof fund === 'string',
    )
  }, [fundsQuery.data])

  const allFunds = useMemo(() => {
    const funds: Address[] = []

    if (communityFundAddress) {
      funds.push(communityFundAddress)
    }

    for (const fund of factoryFunds) {
      if (!funds.includes(fund)) {
        funds.push(fund)
      }
    }

    return funds
  }, [factoryFunds])

  /*
   * If the selected project disappears or no project has been selected,
   * fall back to the original deployed fund or the first factory fund.
   */
  const activeFundAddress = useMemo(() => {
    if (
      selectedFund &&
      allFunds.includes(selectedFund)
    ) {
      return selectedFund
    }

    return allFunds[0]
  }, [selectedFund, allFunds])

  const fund = useFund(activeFundAddress)

  const contribute = useContribute(activeFundAddress)

  const refund = useClaimRefund(activeFundAddress)

  /*
   * Read the creator directly from the selected CommunityFund.
   * This allows the UI to correctly identify creator-only actions.
   */
  const creatorQuery = useReadContract({
    address: activeFundAddress ?? '0x0000000000000000000000000000000000000000',
    abi: communityFundAbi,
    functionName: 'creator',
    query: {
      enabled: Boolean(activeFundAddress),
    },
  })

  const creator =
    typeof creatorQuery.data === 'string'
      ? creatorQuery.data as Address
      : undefined

  const isCreator =
    Boolean(address) &&
    Boolean(creator) &&
    address?.toLowerCase() === creator?.toLowerCase()

  const raised =
    typeof fund.raised === 'bigint'
      ? fund.raised
      : 0n

  const target =
    typeof fund.target === 'bigint'
      ? fund.target
      : 0n

  const progress =
    target > 0n
      ? Math.min(
          100,
          Number((raised * 100n) / target),
        )
      : 0

  const status =
    typeof fund.status === 'number' ||
    typeof fund.status === 'bigint'
      ? statuses[Number(fund.status)] ?? 'Unavailable'
      : 'Unavailable'

  const canContribute =
    readiness.isConnected &&
    readiness.isCorrectNetwork &&
    Boolean(activeFundAddress) &&
    status === 'Funding'

  const submitContribution = () => {
    try {
      if (!canContribute) {
        setNotice(
          readiness.isConnected
            ? 'Connect to Bohr Testnet and select a funding project.'
            : 'Connect your wallet to contribute.',
        )
        return
      }

      const value = parseEther(amount)

      if (value <= 0n) {
        setNotice('Enter a valid BOT amount greater than zero.')
        return
      }

      setNotice(
        `You are contributing ${amount} BOT to this community fund.`,
      )

      contribute.contribute(value)
    } catch {
      setNotice(
        'Enter a valid BOT amount greater than zero.',
      )
    }
  }

  const createProject = () => {
    try {
      if (!readiness.isConnected) {
        setNotice('Connect your wallet before creating a project.')
        return
      }

      if (!readiness.isCorrectNetwork) {
        setNotice('Switch your wallet to Bohr Testnet (chain 968).')
        return
      }

      if (!newTitle.trim()) {
        setNotice('Enter a project title.')
        return
      }

      const targetValue = parseEther(newTarget)

      if (targetValue <= 0n) {
        setNotice(
          'Enter a funding target greater than zero.',
        )
        return
      }

      const days = Number(newDeadlineDays)

      if (!Number.isFinite(days) || days <= 0) {
        setNotice(
          'Enter a valid deadline greater than zero days.',
        )
        return
      }

      const deadline =
        BigInt(
          Math.floor(Date.now() / 1000) +
            days * 24 * 60 * 60,
        )

      createFund.createFund(
        newTitle.trim(),
        newMetadataUri.trim(),
        targetValue,
        deadline,
      )

      setNotice(
        'Project creation submitted. Waiting for confirmation.',
      )
    } catch {
      setNotice(
        'Enter valid project details before creating the project.',
      )
    }
  }

  const projectCount = allFunds.length

  return (
    <main>
      <section className="hero-panel">
        <p className="eyebrow">
          Bohr Testnet · BOT community funds
        </p>

        <h1>
          Build the thing your community needs.
        </h1>

        <p className="hero-copy">
          A transparent home for shared goals, contributions,
          and accountable spending. Every project has a
          defined purpose and an on-chain trail.
        </p>

        <div className="hero-actions">
          <a
            className="button button-primary"
            href="#fund"
          >
            View projects
          </a>

          <a
            className="button button-secondary"
            href="#spending"
          >
            Review spending
          </a>
        </div>
      </section>

      <section
        className="section-heading"
        id="fund"
      >
        <div>
          <p className="eyebrow">
            Community board
          </p>

          <h2>
            {fund.isConfigured
              ? String(
                  fund.title || 'Community fund',
                )
              : 'Fund dashboard'}
          </h2>
        </div>

        <span className="status-pill">
          {status}
        </span>
      </section>

      <section className="action-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Community projects
            </p>

            <h3>
              {projectCount} project
              {projectCount === 1 ? '' : 's'}
              {' '}available
            </h3>
          </div>

          <button
            className="button button-primary"
            type="button"
            onClick={() =>
              setShowCreateForm((current) => !current)
            }
          >
            {showCreateForm
              ? 'Close form'
              : 'Create project'}
          </button>
        </div>

        {allFunds.length > 0 ? (
          <div className="principle-list">
            {allFunds.map((fundAddress) => (
              <button
                key={fundAddress}
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setSelectedFund(fundAddress)
                  setNotice('')
                }}
              >
                {fundAddress === communityFundAddress
                  ? 'Original Community Fund'
                  : `Project ${fundAddress.slice(
                      0,
                      6,
                    )}...${fundAddress.slice(-4)}`}
              </button>
            ))}
          </div>
        ) : (
          <p className="muted-copy">
            No projects have been created through the
            factory yet.
          </p>
        )}

        {showCreateForm && (
          <div className="action-grid">
            <article className="action-panel">
              <p className="eyebrow">
                New project
              </p>

              <h3>
                Create a community funding project.
              </h3>

              <label>
                Project title
                <input
                  value={newTitle}
                  onChange={(event) =>
                    setNewTitle(event.target.value)
                  }
                  placeholder="Community solar charging point"
                />
              </label>

              <label>
                Metadata / purpose reference
                <input
                  value={newMetadataUri}
                  onChange={(event) =>
                    setNewMetadataUri(event.target.value)
                  }
                  placeholder="ipfs://..."
                />
              </label>

              <label>
                Funding target in BOT
                <input
                  value={newTarget}
                  onChange={(event) =>
                    setNewTarget(event.target.value)
                  }
                  inputMode="decimal"
                  placeholder="10"
                />
              </label>

              <label>
                Funding deadline
                <input
                  value={newDeadlineDays}
                  onChange={(event) =>
                    setNewDeadlineDays(
                      event.target.value.replace(
                        /\D/g,
                        '',
                      ),
                    )
                  }
                  inputMode="numeric"
                  placeholder="7"
                />
                <small>
                  Number of days from now
                </small>
              </label>

              <button
                className="button button-primary action-button"
                type="button"
                disabled={
                  createFund.isPending ||
                  createFund.isConfirming ||
                  !readiness.isConnected ||
                  !readiness.isCorrectNetwork
                }
                onClick={createProject}
              >
                {createFund.isConfirming
                  ? 'Waiting for confirmation'
                  : createFund.isPending
                    ? 'Confirm in wallet'
                    : 'Create project'}
              </button>

              {createFund.hash &&
                !createFund.isConfirmed && (
                  <p className="transaction-note">
                    Project creation transaction
                    submitted. Waiting for confirmation.
                  </p>
                )}

              {createFund.isConfirmed && (
                <p className="transaction-note">
                  Project created successfully on-chain.
                </p>
              )}
            </article>
          </div>
        )}
      </section>

      {!fund.isConfigured ? (
        <section className="setup-panel">
          <p className="eyebrow">
            Deployment preparation
          </p>

          <h3>
            No project is currently available.
          </h3>

          <p>
            Connect the factory deployment and create
            your first community project.
          </p>
        </section>
      ) : (
        <>
          <section className="fund-card live-fund-card">
            <div className="card-topline">
              <span className="status-dot" />
              {status}
            </div>

            <h3>
              {String(
                fund.title || 'Community fund',
              )}
            </h3>

            <p>
              {formatPurpose(fund.metadataUri)}
            </p>

            <div className="progress-track">
              <span
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <div className="fund-metrics">
              <strong>
                {formatBot(fund.raised)}
              </strong>

              <span>
                of {formatBot(fund.target)}
              </span>
            </div>

            <div className="card-footer">
              <span>
                {String(
                  fund.contributors ?? 0,
                )}{' '}
                contributors
              </span>

              <span>
                Deadline{' '}
                {formatDeadline(fund.deadline)}
              </span>
            </div>

            <div className="card-footer">
              <span>
                Creator:{' '}
                {creator
                  ? `${creator.slice(
                      0,
                      6,
                    )}...${creator.slice(-4)}`
                  : 'Loading...'}
              </span>

              {isCreator && (
                <span>
                  You are the creator
                </span>
              )}
            </div>
          </section>

          <section className="action-grid">
            <article className="action-panel">
              <p className="eyebrow">
                Contribute
              </p>

              <h3>
                Help this goal reach the
                community.
              </h3>

              <label>
                Amount in BOT
                <input
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value,
                    )
                  }
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </label>

              <button
                className="button button-primary action-button"
                type="button"
                disabled={
                  contribute.isPending ||
                  contribute.isConfirming
                }
                onClick={
                  submitContribution
                }
              >
                {contribute.isConfirming
                  ? 'Waiting for confirmation'
                  : 'Contribute'}
              </button>

              {contribute.hash &&
                !contribute.isConfirmed && (
                  <p className="transaction-note">
                    Transaction submitted.
                    Waiting for confirmation.
                  </p>
                )}
            </article>

            <article className="action-panel">
              <p className="eyebrow">
                Refund
              </p>

              <h3>
                Campaign failed or was
                cancelled?
              </h3>

              <p>
                Eligible contributors can claim
                their recorded contribution after
                the fund enters a failed or
                cancelled state.
              </p>

              <button
                className="button button-secondary action-button"
                type="button"
                disabled={
                  !readiness.isConnected ||
                  refund.isPending ||
                  refund.isConfirming ||
                  (status !== 'Failed' &&
                    status !== 'Cancelled')
                }
                onClick={() =>
                  refund.claimRefund()
                }
              >
                {refund.isConfirming
                  ? 'Waiting for confirmation'
                  : 'Claim refund'}
              </button>
            </article>
          </section>
        </>
      )}

      <SpendingPanel
        address={address}
        fundAddress={activeFundAddress}
        status={status}
        isCreator={isCreator}
        onNotice={setNotice}
      />

      {(notice ||
        contribute.isConfirmed ||
        refund.isConfirmed ||
        createFund.isConfirmed ||
        explainError(contribute.error) ||
        explainError(refund.error) ||
        explainError(createFund.error)) && (
        <p
          className="notice"
          role="status"
        >
          {notice ||
            (createFund.isConfirmed
              ? 'Your new community project has been created on-chain.'
              : contribute.isConfirmed ||
                  refund.isConfirmed
                ? 'Your transaction has been confirmed on-chain.'
                : explainError(
                      contribute.error,
                    ) ||
                    explainError(
                      refund.error,
                    ) ||
                    explainError(
                      createFund.error,
                    ))}
        </p>
      )}

      <section
        className="principles"
        id="create"
      >
        <div>
          <p className="eyebrow">
            Designed for trust
          </p>

          <h2>
            Shared purpose. Visible decisions.
          </h2>
        </div>

        <div className="principle-list">
          <p>
            <strong>01</strong>{' '}
            Contributions belong to a defined
            community goal.
          </p>

          <p>
            <strong>02</strong>{' '}
            Spending requests make every proposed
            use legible.
          </p>

          <p>
            <strong>03</strong>{' '}
            Equal contributor approvals keep
            decisions accountable.
          </p>
        </div>
      </section>
    </main>
  )
}

type SpendingPanelProps = {
  address?: Address
  fundAddress?: Address
  status: string
  isCreator: boolean
  onNotice: (notice: string) => void
}

function SpendingPanel({
  address,
  fundAddress,
  status,
  isCreator,
  onNotice,
}: SpendingPanelProps) {
  const [requestId, setRequestId] =
    useState('0')

  const [recipient, setRecipient] =
    useState('')

  const [requestAmount, setRequestAmount] =
    useState('')

  const [purpose, setPurpose] =
    useState('')

  const numericId = BigInt(
    requestId || '0',
  )

  const request = useSpendingRequests(
    numericId,
    fundAddress,
  )

  const approval = useApprovalStatus(
    numericId,
    address,
    fundAddress,
  )

  const approve =
    useApproveSpendingRequest(
      fundAddress,
    )

  const execute =
    useExecuteSpendingRequest(
      fundAddress,
    )

  const create =
    useCreateSpendingRequest(
      fundAddress,
    )

  const details = request.data as
    | {
        recipient: Address
        amount: bigint
        metadataUri: string
        approvalCount: bigint
        executed: boolean
        cancelled: boolean
      }
    | undefined

  const canReview =
    status === 'Funded' &&
    Boolean(details)

  const createRequest = () => {
    try {
      if (!isCreator) {
        onNotice(
          'Only the project creator can create a spending request.',
        )
        return
      }

      if (!isAddress(recipient)) {
        onNotice(
          'Enter a valid recipient address.',
        )
        return
      }

      const value =
        parseEther(requestAmount)

      if (value <= 0n) {
        onNotice(
          'Enter a valid BOT amount greater than zero.',
        )
        return
      }

      create.createSpendingRequest(
        recipient,
        value,
        purpose,
      )

      onNotice(
        'Spending request submitted. Waiting for confirmation.',
      )
    } catch {
      onNotice(
        'Enter a valid recipient and BOT amount.',
      )
    }
  }

  return (
    <section
      className="spending-section"
      id="spending"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            Community approval
          </p>

          <h2>
            Spending requests
          </h2>
        </div>

        <span className="status-pill">
          Equal votes
        </span>
      </div>

      <div className="action-grid">
        <article className="action-panel">
          <p className="eyebrow">
            Inspect a request
          </p>

          <label>
            Request number
            <input
              value={requestId}
              onChange={(event) =>
                setRequestId(
                  event.target.value.replace(
                    /\D/g,
                    '',
                  ),
                )
              }
              inputMode="numeric"
            />
          </label>

          {details ? (
            <div className="request-details">
              <strong>
                {formatBot(details.amount)}
              </strong>

              <span>
                {details.metadataUri ||
                  'No purpose reference'}
              </span>

              <span>
                {details.approvalCount.toString()}{' '}
                approvals ·{' '}
                {details.executed
                  ? 'Executed'
                  : details.cancelled
                    ? 'Cancelled'
                    : 'Open'}
              </span>
            </div>
          ) : (
            <p className="muted-copy">
              Requests become visible after a
              funded campaign creates one.
            </p>
          )}

          <button
            className="button button-secondary action-button"
            type="button"
            disabled={
              !canReview ||
              Boolean(approval.data) ||
              approve.isPending ||
              approve.isConfirming
            }
            onClick={() => {
              approve.approveSpendingRequest(
                numericId,
              )

              onNotice(
                'You are approving this community spending request.',
              )
            }}
          >
            {approve.isConfirming
              ? 'Waiting for confirmation'
              : 'Approve request'}
          </button>

          <button
            className="button button-primary action-button"
            type="button"
            disabled={
              !canReview ||
              !details ||
              details.executed ||
              details.cancelled ||
              details.approvalCount < 1n ||
              execute.isPending ||
              execute.isConfirming
            }
            onClick={() =>
              execute.executeSpendingRequest(
                numericId,
              )
            }
          >
            {execute.isConfirming
              ? 'Waiting for confirmation'
              : 'Execute request'}
          </button>
        </article>

        <article className="action-panel">
          <p className="eyebrow">
            Creator action
          </p>

          <h3>
            Propose a project expense.
          </h3>

          <label>
            Recipient
            <input
              value={recipient}
              onChange={(event) =>
                setRecipient(
                  event.target.value,
                )
              }
              placeholder="0x..."
            />
          </label>

          <label>
            Amount in BOT
            <input
              value={requestAmount}
              onChange={(event) =>
                setRequestAmount(
                  event.target.value,
                )
              }
              inputMode="decimal"
              placeholder="0.00"
            />
          </label>

          <label>
            Purpose reference
            <input
              value={purpose}
              onChange={(event) =>
                setPurpose(
                  event.target.value,
                )
              }
              placeholder="ipfs://..."
            />
          </label>

          <button
            className="button button-primary action-button"
            type="button"
            disabled={
              !isCreator ||
              status !== 'Funded' ||
              create.isPending ||
              create.isConfirming
            }
            onClick={createRequest}
          >
            {create.isConfirming
              ? 'Waiting for confirmation'
              : isCreator
                ? 'Create spending request'
                : 'Creator only'}
          </button>
        </article>
      </div>
    </section>
  )
}

export default HomePage