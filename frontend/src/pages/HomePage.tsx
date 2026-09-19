import { useState } from 'react'
import { formatEther, parseEther, type Address } from 'viem'
import { useAccount } from 'wagmi'
import {
  useApprovalStatus,
  useApproveSpendingRequest,
  useClaimRefund,
  useContribute,
  useCreateSpendingRequest,
  useExecuteSpendingRequest,
  useFund,
  useSpendingRequests,
  useWalletReadiness,
} from '../hooks/useCommunityFund'

const statuses = ['Funding', 'Funded', 'Failed', 'Completed', 'Cancelled'] as const

function formatBot(value: unknown) {
  return typeof value === 'bigint' ? `${formatEther(value)} BOT` : '— BOT'
}

function formatDeadline(value: unknown) {
  return typeof value === 'bigint' ? new Date(Number(value) * 1000).toLocaleDateString() : '—'
}

function formatPurpose(value: unknown) {
  if (typeof value !== 'string' || value.startsWith('ipfs://replace-with-')) {
    return 'Shared community project with transparent on-chain funding.'
  }
  return value
}

function explainError(error: Error | null) {
  if (!error) return ''
  const message = error.message.toLowerCase()
  if (message.includes('user rejected') || message.includes('rejected')) return 'The wallet rejected this transaction.'
  if (message.includes('insufficient funds')) return 'Your wallet does not have enough BOT for this transaction.'
  if (message.includes('wrong network') || message.includes('chain')) return 'Switch your wallet to Bohr Testnet (chain 968).'
  return 'The transaction could not be completed. Check the fund state and try again.'
}

function HomePage() {
  const fund = useFund()
  const readiness = useWalletReadiness()
  const { address } = useAccount()
  const contribute = useContribute()
  const refund = useClaimRefund()
  const [amount, setAmount] = useState('')
  const [notice, setNotice] = useState('')

  const raised = typeof fund.raised === 'bigint' ? fund.raised : 0n
  const target = typeof fund.target === 'bigint' ? fund.target : 0n
  const progress = target > 0n ? Math.min(100, Number((raised * 100n) / target)) : 0
  const status = typeof fund.status === 'number' || typeof fund.status === 'bigint' ? statuses[Number(fund.status)] : 'Unavailable'
  const canContribute = readiness.isConnected && readiness.isCorrectNetwork && readiness.hasContract && status === 'Funding'

  const submitContribution = () => {
    try {
      if (!canContribute) {
        setNotice(readiness.isConnected ? 'Connect to Bohr Testnet and configure the fund address first.' : 'Connect your wallet to contribute.')
        return
      }
      const value = parseEther(amount)
      setNotice(`You are contributing ${amount} BOT to this community fund.`)
      contribute.contribute(value)
    } catch {
      setNotice('Enter a valid BOT amount greater than zero.')
    }
  }

  return (
    <main>
      <section className="hero-panel">
        <p className="eyebrow">Bohr Testnet · BOT community funds</p>
        <h1>Build the thing your community needs.</h1>
        <p className="hero-copy">A transparent home for shared goals, contributions, and accountable spending. Every fund has a defined purpose and an on-chain trail.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="#fund">View fund</a>
          <a className="button button-secondary" href="#spending">Review spending</a>
        </div>
      </section>

      <section className="section-heading" id="fund">
        <div><p className="eyebrow">Community board</p><h2>{fund.isConfigured ? String(fund.title || 'Community fund') : 'Fund dashboard'}</h2></div>
        <span className="status-pill">{status}</span>
      </section>

      {!fund.isConfigured ? (
        <section className="setup-panel">
          <p className="eyebrow">Deployment preparation</p>
          <h3>No contract address configured yet.</h3>
          <p>Set VITE_COMMUNITY_FUND_CONTRACT_ADDRESS after Prompt 3 deployment. The dashboard will begin reading this fund without any code changes.</p>
        </section>
      ) : (
        <>
          <section className="fund-card live-fund-card">
            <div className="card-topline"><span className="status-dot" />{status}</div>
            <h3>{String(fund.title || 'Community fund')}</h3>
            <p>{formatPurpose(fund.metadataUri)}</p>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
            <div className="fund-metrics"><strong>{formatBot(fund.raised)}</strong><span>of {formatBot(fund.target)}</span></div>
            <div className="card-footer"><span>{String(fund.contributors ?? 0)} contributors</span><span>Deadline {formatDeadline(fund.deadline)}</span></div>
          </section>

          <section className="action-grid">
            <article className="action-panel">
              <p className="eyebrow">Contribute</p>
              <h3>Help this goal reach the community.</h3>
              <label>Amount in BOT<input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0.00" /></label>
              <button className="button button-primary action-button" type="button" disabled={contribute.isPending || contribute.isConfirming} onClick={submitContribution}>{contribute.isConfirming ? 'Waiting for confirmation' : 'Contribute'}</button>
              {contribute.hash && !contribute.isConfirmed && <p className="transaction-note">Transaction submitted. Waiting for confirmation.</p>}
            </article>
            <article className="action-panel">
              <p className="eyebrow">Refund</p>
              <h3>Campaign failed or was cancelled?</h3>
              <p>Eligible contributors can claim their recorded contribution after the fund enters a failed or cancelled state.</p>
              <button className="button button-secondary action-button" type="button" disabled={!readiness.isConnected || refund.isPending || refund.isConfirming || (status !== 'Failed' && status !== 'Cancelled')} onClick={() => refund.claimRefund()}>{refund.isConfirming ? 'Waiting for confirmation' : 'Claim refund'}</button>
            </article>
          </section>
        </>
      )}

      <SpendingPanel address={address} status={status} onNotice={setNotice} />
      {(notice || contribute.isConfirmed || refund.isConfirmed || explainError(contribute.error) || explainError(refund.error)) && <p className="notice" role="status">{notice || (contribute.isConfirmed || refund.isConfirmed ? 'Your transaction has been confirmed on-chain.' : explainError(contribute.error) || explainError(refund.error))}</p>}

      <section className="principles" id="create">
        <div><p className="eyebrow">Designed for trust</p><h2>Shared purpose. Visible decisions.</h2></div>
        <div className="principle-list"><p><strong>01</strong> Contributions belong to a defined community goal.</p><p><strong>02</strong> Spending requests make every proposed use legible.</p><p><strong>03</strong> Equal contributor approvals keep decisions accountable.</p></div>
      </section>
    </main>
  )
}

type SpendingPanelProps = { address?: Address; status: string; onNotice: (notice: string) => void }

function SpendingPanel({ address, status, onNotice }: SpendingPanelProps) {
  const [requestId, setRequestId] = useState('0')
  const [recipient, setRecipient] = useState('')
  const [requestAmount, setRequestAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const numericId = BigInt(requestId || '0')
  const request = useSpendingRequests(numericId)
  const approval = useApprovalStatus(numericId, address)
  const approve = useApproveSpendingRequest()
  const execute = useExecuteSpendingRequest()
  const create = useCreateSpendingRequest()
  const details = request.data as { recipient: Address; amount: bigint; metadataUri: string; approvalCount: bigint; executed: boolean; cancelled: boolean } | undefined
  const canReview = status === 'Funded' && Boolean(details)

  const createRequest = () => {
    try {
      create.createSpendingRequest(recipient as Address, parseEther(requestAmount), purpose)
      onNotice('Spending request submitted. Waiting for confirmation.')
    } catch {
      onNotice('Enter a valid recipient and BOT amount.')
    }
  }

  return (
    <section className="spending-section" id="spending">
      <div className="section-heading"><div><p className="eyebrow">Community approval</p><h2>Spending requests</h2></div><span className="status-pill">Equal votes</span></div>
      <div className="action-grid">
        <article className="action-panel">
          <p className="eyebrow">Inspect a request</p>
          <label>Request number<input value={requestId} onChange={(event) => setRequestId(event.target.value.replace(/\D/g, ''))} inputMode="numeric" /></label>
          {details ? <div className="request-details"><strong>{formatBot(details.amount)}</strong><span>{details.metadataUri || 'No purpose reference'}</span><span>{details.approvalCount.toString()} approvals · {details.executed ? 'Executed' : details.cancelled ? 'Cancelled' : 'Open'}</span></div> : <p className="muted-copy">Requests become visible after a funded campaign creates one.</p>}
          <button className="button button-secondary action-button" type="button" disabled={!canReview || Boolean(approval.data) || approve.isPending || approve.isConfirming} onClick={() => { approve.approveSpendingRequest(numericId); onNotice('You are approving this community spending request.') }}>{approve.isConfirming ? 'Waiting for confirmation' : 'Approve request'}</button>
          <button className="button button-primary action-button" type="button" disabled={!canReview || !details || details.executed || details.cancelled || details.approvalCount < 1n || execute.isPending || execute.isConfirming} onClick={() => execute.executeSpendingRequest(numericId)}>{execute.isConfirming ? 'Waiting for confirmation' : 'Execute request'}</button>
        </article>
        <article className="action-panel">
          <p className="eyebrow">Creator action</p>
          <h3>Propose a project expense.</h3>
          <label>Recipient<input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="0x..." /></label>
          <label>Amount in BOT<input value={requestAmount} onChange={(event) => setRequestAmount(event.target.value)} inputMode="decimal" placeholder="0.00" /></label>
          <label>Purpose reference<input value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="ipfs://..." /></label>
          <button className="button button-primary action-button" type="button" disabled={status !== 'Funded' || create.isPending || create.isConfirming} onClick={createRequest}>{create.isConfirming ? 'Waiting for confirmation' : 'Create spending request'}</button>
        </article>
      </div>
    </section>
  )
}

export default HomePage
