function Guidelines() {
  return (
    <main className="guidelines-page">
      <section className="guidelines-hero">
        <p className="eyebrow">BotCommunityFund Guidelines</p>

        <h1>Understand the fund before you participate.</h1>

        <p className="guidelines-intro">
          BotCommunityFund lets a community fund a shared purpose and collectively
          approve how those funds are spent. The smart contract enforces the rules
          described below.
        </p>

        <div className="guidelines-actions">
          <a className="button button-primary" href="/">
            Back to CommunityFund
          </a>

          <a className="button button-secondary" href="/#fund">
            Explore funds
          </a>
        </div>
      </section>

      <section className="guidelines-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 · Overview</p>
            <h2>What is BotCommunityFund?</h2>
          </div>
        </div>

        <div className="guidelines-overview">
          <p>
            A fund is created for a specific community purpose with a funding
            target and deadline. Contributors send funds directly to the smart
            contract.
          </p>

          <p>
            Once the target is reached, contributors become the approval
            community for spending requests. The creator can propose where the
            money should go, but approved requests are executed through the
            smart contract.
          </p>

          <p>
            The creator does not have a direct withdrawal function. Funds are
            released through spending requests that receive the required
            contributor approvals.
          </p>
        </div>
      </section>

      <section className="guidelines-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 · Fund lifecycle</p>
            <h2>How the process works</h2>
          </div>
        </div>

        <div className="guidelines-flow">
          <article className="guideline-step">
            <span>01</span>
            <h3>Fund is created</h3>
            <p>
              A creator defines the fund title, purpose, funding target and
              deadline.
            </p>
          </article>

          <div className="flow-arrow" aria-hidden="true">
            →
          </div>

          <article className="guideline-step">
            <span>02</span>
            <h3>Community contributes</h3>
            <p>
              Anyone can contribute while the fund is still accepting funds and
              before the deadline.
            </p>
          </article>

          <div className="flow-arrow" aria-hidden="true">
            →
          </div>

          <article className="guideline-step">
            <span>03</span>
            <h3>Target is reached</h3>
            <p>
              When the exact funding target is reached, the fund becomes
              <strong> Funded</strong>.
            </p>
          </article>

          <div className="flow-arrow" aria-hidden="true">
            →
          </div>

          <article className="guideline-step">
            <span>04</span>
            <h3>Spending is proposed</h3>
            <p>
              The creator creates a spending request with a recipient, amount
              and purpose.
            </p>
          </article>

          <div className="flow-arrow" aria-hidden="true">
            →
          </div>

          <article className="guideline-step">
            <span>05</span>
            <h3>Contributors approve</h3>
            <p>
              Contributors vote on the request. Each contributor has one
              approval regardless of contribution size.
            </p>
          </article>

          <div className="flow-arrow" aria-hidden="true">
            →
          </div>

          <article className="guideline-step">
            <span>06</span>
            <h3>Request is executed</h3>
            <p>
              Once enough approvals are reached, anyone can execute the request
              and the contract sends the approved amount to the recipient.
            </p>
          </article>
        </div>
      </section>

      <section className="guidelines-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">03 · Roles</p>
            <h2>Who can do what?</h2>
          </div>
        </div>

        <div className="guidelines-role-grid">
          <article className="guideline-card">
            <span className="guideline-number">Creator</span>
            <h3>Creates and proposes</h3>

            <ul>
              <li>Creates the fund.</li>
              <li>Sets the funding target and deadline.</li>
              <li>Creates spending requests after funding succeeds.</li>
              <li>Can cancel the fund while it is still funding.</li>
              <li>Can cancel an unexecuted spending request.</li>
            </ul>
          </article>

          <article className="guideline-card">
            <span className="guideline-number">Contributor</span>
            <h3>Funds and approves</h3>

            <ul>
              <li>Can contribute while the fund is open.</li>
              <li>Becomes part of the contributor community.</li>
              <li>Can approve spending requests after funding succeeds.</li>
              <li>Has one approval regardless of contribution amount.</li>
              <li>Can claim a refund when the fund becomes refundable.</li>
            </ul>
          </article>

          <article className="guideline-card">
            <span className="guideline-number">Anyone</span>
            <h3>Can execute approved spending</h3>

            <ul>
              <li>Does not need to be the creator.</li>
              <li>Does not need to be a contributor.</li>
              <li>Can execute once the required approvals are reached.</li>
              <li>The smart contract sends the approved amount directly.</li>
            </ul>
          </article>
        </div>

        <p className="guidelines-note">
          <strong>Important:</strong> The creator does not automatically lose
          voting rights. If the creator also contributes to the fund, the
          creator is a contributor and can approve spending requests like any
          other contributor.
        </p>
      </section>

      <section className="guidelines-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">04 · Contributions</p>
            <h2>How funding works</h2>
          </div>
        </div>

        <div className="guidelines-two-column">
          <div>
            <h3>While funding is open</h3>
            <p>
              Anyone can contribute to the fund before its deadline, provided
              the fund has not already reached its target.
            </p>
          </div>

          <div>
            <h3>Exact target required</h3>
            <p>
              A contribution cannot push the fund above its target. The final
              contribution must bring the total to the exact target.
            </p>
          </div>

          <div>
            <h3>One contributor, one vote</h3>
            <p>
              Voting power is based on being a contributor, not on how much
              someone contributed.
            </p>
          </div>

          <div>
            <h3>Funds stay in the contract</h3>
            <p>
              Contributions are sent to the CommunityFund contract address and
              remain there until a valid contract action releases them.
            </p>
          </div>
        </div>
      </section>

      <section className="guidelines-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">05 · Spending</p>
            <h2>How community spending works</h2>
          </div>
        </div>

        <div className="guidelines-spending">
          <article className="guideline-card">
            <span className="guideline-number">Step 01</span>
            <h3>Creator proposes</h3>
            <p>
              After the funding target is reached, the creator submits a
              spending request containing the recipient address, amount and
              purpose or metadata.
            </p>
          </article>

          <article className="guideline-card">
            <span className="guideline-number">Step 02</span>
            <h3>Contributors approve</h3>
            <p>
              Each contributor can approve a request once. The approval count
              increases by one for each contributor who approves.
            </p>
          </article>

          <article className="guideline-card">
            <span className="guideline-number">Step 03</span>
            <h3>Approval threshold</h3>
            <p>
              The required number of approvals is more than half of the
              contributor count. It is calculated as contributor count divided
              by two, plus one.
            </p>
          </article>

          <article className="guideline-card">
            <span className="guideline-number">Step 04</span>
            <h3>Execution</h3>
            <p>
              Once the required approvals are reached and the contract has
              enough balance, anyone can execute the request.
            </p>
          </article>
        </div>
      </section>

      <section className="guidelines-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">06 · Money movement</p>
            <h2>Where does the money go?</h2>
          </div>
        </div>

        <div className="money-flow">
          <div className="money-flow-box">
            <span>01</span>
            <strong>Contributor</strong>
            <small>Sends ETH</small>
          </div>

          <div className="money-flow-arrow" aria-hidden="true">
            →
          </div>

          <div className="money-flow-box">
            <span>02</span>
            <strong>CommunityFund</strong>
            <small>Holds the funds</small>
          </div>

          <div className="money-flow-arrow" aria-hidden="true">
            →
          </div>

          <div className="money-flow-box">
            <span>03</span>
            <strong>Approved recipient</strong>
            <small>Receives requested amount</small>
          </div>
        </div>

        <p className="guidelines-note">
          The creator does not receive the funds simply because they created the
          fund. Money is transferred by the smart contract only when a valid
          spending request satisfies the contract's approval and balance rules.
        </p>
      </section>

      <section className="guidelines-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">07 · Failed funding</p>
            <h2>What happens if the target is not reached?</h2>
          </div>
        </div>

        <div className="guidelines-alert-grid">
          <article className="guideline-card guideline-card-warning">
            <span className="guideline-number">Deadline</span>
            <h3>Funding can fail</h3>
            <p>
              If the deadline arrives while the fund is still below its target,
              anyone can mark the funding attempt as failed.
            </p>
          </article>

          <article className="guideline-card guideline-card-warning">
            <span className="guideline-number">Refund</span>
            <h3>Contributors can claim back</h3>
            <p>
              Once the status is Failed, each contributor can claim the amount
              they contributed.
            </p>
          </article>
        </div>
      </section>

      <section className="guidelines-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">08 · Cancellation</p>
            <h2>What happens when a fund is cancelled?</h2>
          </div>
        </div>

        <div className="guidelines-two-column">
          <div>
            <h3>Before funding succeeds</h3>
            <p>
              The creator can cancel the fund while it is still in the Funding
              state.
            </p>
          </div>

          <div>
            <h3>After cancellation</h3>
            <p>
              The fund enters the Cancelled state and contributors can claim
              their recorded contributions back.
            </p>
          </div>

          <div>
            <h3>Spending request cancellation</h3>
            <p>
              The creator can cancel an individual spending request while the
              fund is Funded, provided the request has not already been executed
              or cancelled.
            </p>
          </div>

          <div>
            <h3>Cancelled requests cannot execute</h3>
            <p>
              Once a spending request is cancelled, it can no longer be
              executed.
            </p>
          </div>
        </div>
      </section>

      <section className="guidelines-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">09 · Fund states</p>
            <h2>Understanding the lifecycle</h2>
          </div>
        </div>

        <div className="status-grid">
          <article className="status-card">
            <span>Funding</span>
            <p>
              The fund is accepting contributions before the deadline.
            </p>
          </article>

          <article className="status-card">
            <span>Funded</span>
            <p>
              The exact target has been reached and spending requests can be
              created and approved.
            </p>
          </article>

          <article className="status-card">
            <span>Failed</span>
            <p>
              The deadline passed before the target was reached. Contributors
              can claim refunds.
            </p>
          </article>

          <article className="status-card">
            <span>Completed</span>
            <p>
              A spending execution reduced the contract balance to zero.
            </p>
          </article>

          <article className="status-card">
            <span>Cancelled</span>
            <p>
              The creator cancelled the fund while it was still Funding.
              Contributors can claim refunds.
            </p>
          </article>
        </div>
      </section>

      <section className="guidelines-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">10 · Before you transact</p>
            <h2>Important things to remember</h2>
          </div>
        </div>

        <div className="guidelines-checklist">
          <p>
            <strong>01</strong>
            Review the fund title, purpose, target and deadline before
            contributing.
          </p>

          <p>
            <strong>02</strong>
            Confirm the recipient address and requested amount before approving
            a spending request.
          </p>

          <p>
            <strong>03</strong>
            Every blockchain transaction requires network gas. Gas is separate
            from the contribution amount.
          </p>

          <p>
            <strong>04</strong>
            Blockchain transactions are public and generally irreversible once
            confirmed.
          </p>

          <p>
            <strong>05</strong>
            The smart contract is the final authority on whether an action can
            be completed.
          </p>

          <p>
            <strong>06</strong>
            BotCommunityFund currently operates on the Bohr Testnet. Testnet
            assets are not the same as mainnet funds.
          </p>
        </div>
      </section>

      <section className="guidelines-final">
        <p className="eyebrow">Ready?</p>

        <h2>Now you know how the fund works.</h2>

        <p>
          Explore existing funds, contribute to a project, or create a new
          community fund.
        </p>

        <a className="button button-primary" href="/">
          Return to CommunityFund
        </a>
      </section>
    </main>
  )
}

export default Guidelines