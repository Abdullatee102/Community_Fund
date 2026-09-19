# BotCommunityFund

BotCommunityFund is a Web3 community crowdfunding and fund-management platform for shared projects.

Instead of a rotating savings model, contributors collectively fund a defined community goal. The platform makes the fund's **purpose, target, progress, spending requests, approvals, releases, and refunds** transparent and verifiable on-chain.

The system is built around a simple principle:

> Community members contribute to a shared goal, contributors control spending through equal voting rights, and funds can only move according to the rules enforced by the smart contract.

---

## Project Structure

```text
BotCommunityFund/

├── contract/       # Solidity + Foundry smart contract workspace
└── frontend/       # React + Vite + TypeScript frontend
```

---

## Frontend Stack

* React
* Vite
* TypeScript
* wagmi
* viem
* Reown AppKit
* TanStack Query

## Smart Contract Stack

* Solidity
* Foundry
* OpenZeppelin

---

# Network

The application is configured for the **Bohr Testnet**.

| Property     | Value                     |
| ------------ | ------------------------- |
| Network      | Bohr Testnet              |
| Chain ID     | `968`                     |
| RPC          | `https://rpc.bohr.life`   |
| Native Token | `BOT`                     |
| Explorer     | `https://scan.bohr.life/` |
| Total Supply | 150 million BOT           |

---

# Deployed Contract

The current CommunityFund contract is deployed on the Bohr Testnet.

| Property               | Value                                                                |
| ---------------------- | -------------------------------------------------------------------- |
| Contract               | `0xd9E23Ab2C75b14F2D15DA1e928EB380ccd469312`                         |
| Network                | Bohr Testnet                                                         |
| Chain ID               | `968`                                                                |
| Deployment Block       | `23961806`                                                           |
| Deployment Transaction | `0x1fba67db07b4766bc6a6d6a0fe760538c46e48aeb3c5dd2ac6892866eb4bccc5` |

The contract source has been flattened and verified on the Bohr explorer.

The currently deployed contract should be treated as the active deployment. The previous deployment address is historical and should not be used by the frontend.

---

# Getting Started

## Frontend

From the project root:

```powershell
cd frontend
npm install
npm run dev
```

Create the local environment file:

```powershell
Copy-Item .env.example .env.local
```

Configure the required frontend environment variables.

Example:

```env
VITE_REOWN_PROJECT_ID=YOUR_REOWN_PROJECT_ID
VITE_COMMUNITY_FUND_CONTRACT_ADDRESS=0xd9E23Ab2C75b14F2D15DA1e928EB380ccd469312
```

Never place private keys in frontend environment files.

The frontend uses the deployed CommunityFund contract address to interact with the smart contract.

---

# Smart Contract

The smart contract is located inside the `contract/` directory and is developed using Foundry.

From the `contract/` directory:

```powershell
forge build
forge test
```

To install Foundry's standard library if required:

```powershell
forge install foundry-rs/forge-std --no-commit
```

---

# Contract Deployment

Deployment is performed using the Foundry deployment script:

```text
contract/script/DeployCommunityFund.s.sol
```

For a local deployment environment, create an ignored `.env` file:

```powershell
cd contract

Copy-Item .env.example .env
```

Configure:

```env
BOT_RPC_URL=
DEPLOYER_PRIVATE_KEY=

COMMUNITY_FUND_TITLE=
COMMUNITY_FUND_METADATA=
COMMUNITY_FUND_TARGET=
COMMUNITY_FUND_DEADLINE=
```

Then deploy with:

```powershell
forge script script/DeployCommunityFund.s.sol:DeployCommunityFund --rpc-url $env:BOT_RPC_URL --broadcast
```

The deployment script reports information including:

* Network
* Chain ID
* Deployer address
* Contract address
* Explorer information

**Never commit `.env` or private keys to Git.**

---

# Constructor Configuration

The deployed CommunityFund contract is initialized with five constructor arguments:

1. Fund title
2. Metadata URI
3. Funding target
4. Funding deadline
5. Creator address

The current deployment uses:

```text
Title:
Community solar charging point
```

```text
Metadata:
ipfs://replace-with-community-fund-metadata
```

The metadata URI is currently a placeholder and can be replaced with a real IPFS metadata URI in a future deployment.

---

# ABI Generation

After making smart contract changes, rebuild the contract and regenerate the frontend ABI.

From the `contract/` directory:

```powershell
forge build
```

Then:

```powershell
$artifact = Get-Content out/CommunityFund.sol/CommunityFund.json -Raw | ConvertFrom-Json

$artifact.abi | ConvertTo-Json -Depth 100 | Set-Content ../frontend/src/abi/CommunityFund.json
```

The generated ABI is consumed by the frontend for contract reads and writes.

---

# How BotCommunityFund Works

BotCommunityFund follows a defined lifecycle from fund creation to completion, cancellation, or refund.

```text
Create Fund
     ↓
Community Contributes
     ↓
Target Reached
     ↓
Funded
     ↓
Creator Creates Spending Request
     ↓
Contributors Approve
     ↓
Approval Threshold Reached
     ↓
Anyone Executes
     ↓
Funds Sent to Request Recipient
     ↓
Fund Completed When Balance Reaches Zero
```

If funding does not reach the target before the deadline:

```text
Funding
   ↓
Deadline Passes
   ↓
Failed
   ↓
Contributors Claim Refunds
```

A fund can also be cancelled by its creator while it is still in the funding stage:

```text
Funding
   ↓
Creator Cancels
   ↓
Cancelled
   ↓
Contributors Claim Refunds
```

---

# Fund Creation

A creator starts a fund by defining:

* Fund title
* Fund metadata
* Funding target
* Funding deadline
* Creator address

The creator becomes the fund's creator, but the creator does **not** receive special control over contributed funds.

The creator cannot directly withdraw the balance.

---

# Who Can Perform Each Action?

The smart contract defines specific permissions for each activity.

| Activity                       | Who can perform it?                  |
| ------------------------------ | ------------------------------------ |
| Create a fund                  | Fund creator                         |
| Contribute                     | Anyone                               |
| Approve spending request       | Contributors                         |
| Create spending request        | Creator                              |
| Cancel spending request        | Creator                              |
| Execute approved request       | Anyone                               |
| Mark expired funding as failed | Anyone                               |
| Cancel fund while funding      | Creator                              |
| Claim refund                   | Contributors who are entitled to one |

The creator's role alone does **not** give them an approval vote.

However, if the creator also contributed to the fund, the creator is a contributor and therefore receives the same **one approval vote** as every other contributor.

---

# Funding

Anyone can contribute BOT while the fund is in the `Funding` state and before the deadline.

The contract prevents contributions from pushing the fund above its target.

The target must therefore be reached exactly.

For example:

```text
Target:        100 BOT
Current funds: 90 BOT
Remaining:     10 BOT
```

A contribution greater than `10 BOT` will not be accepted because it would exceed the target.

---

# Reaching the Target

Once the total contribution reaches the target:

```text
Funding → Funded
```

The fund then becomes available for spending requests.

At this point, the required approval threshold is calculated from the number of contributors:

```text
requiredApprovals = contributorCount / 2 + 1
```

This means a simple majority of contributors is required.

Voting power is based on **contributor membership**, not contribution amount.

For example:

```text
Contributor A → 1 approval
Contributor B → 1 approval
Contributor C → 1 approval
```

Even if Contributor A contributed significantly more BOT than Contributor B, both still have one approval.

---

# Spending Requests

Only the creator can create a spending request after the fund becomes `Funded`.

A request specifies:

* Recipient
* Amount
* Description

The creator cannot simply withdraw the fund balance.

Instead, every intended expenditure must be represented by a spending request.

A spending request is initially unapproved.

---

# Spending Approvals

Only contributors can approve spending requests.

Each contributor can approve a particular request **once**.

The same contributor cannot provide multiple approvals to increase the approval count.

For example, if there are five contributors:

```text
Contributor A → Approves
Contributor B → Approves
Contributor C → Approves
Contributor D → Does not approve
Contributor E → Does not approve
```

The request has three approvals.

The creator does not receive an automatic approval because they created the fund.

However, if the creator is also a contributor, their single contributor approval counts normally.

---

# Approval Threshold

The spending request requires the fixed contributor approval threshold calculated when the fund becomes funded.

For example:

```text
5 contributors

requiredApprovals = 5 / 2 + 1
                  = 3
```

Therefore, three contributor approvals are required.

Once the threshold is reached and the contract has sufficient balance, the request becomes executable.

---

# Executing a Spending Request

Once the required number of approvals has been reached, **anyone** can execute the request.

The person who executes the request does not need to be:

* The creator
* The recipient
* An approver
* A contributor

Execution simply triggers the contract's rules.

The contract transfers only the amount specified by the approved request to the request recipient.

There is no requirement for the creator to personally execute the payment.

---

# Where Do the Funds Go?

Contributed BOT is held by the smart contract.

The creator does not receive contributed funds directly.

When an approved spending request is executed:

```text
CommunityFund Contract
        │
        │ specified request amount
        ▼
Request Recipient
```

The contract transfers only the approved request amount.

There is no arbitrary creator withdrawal function.

---

# Completing a Fund

When a spending request is executed, the requested amount is transferred from the contract balance.

If the contract balance reaches exactly zero after execution, the fund transitions to:

```text
Completed
```

This indicates that the funded balance has been fully spent through the contract's approved spending process.

---

# Cancelling a Spending Request

The creator can cancel an unexecuted spending request while the fund is `Funded`.

A cancelled request cannot subsequently be executed.

Once a request has already been executed, it cannot be cancelled because the funds have already been transferred.

---

# Cancelling the Fund

The creator can cancel the fund while it is still in the `Funding` state.

Once cancelled:

```text
Funding → Cancelled
```

Contributors can then claim their recorded contributions back.

The creator cannot use fund cancellation to arbitrarily withdraw or redirect community funds.

---

# Failed Funding

If the funding target is not reached before the deadline, anyone can mark the fund as failed.

The state becomes:

```text
Funding → Failed
```

A failed fund does not proceed to spending.

Instead, contributors can claim their recorded contributions back.

---

# Refunds

Refunds are available when a fund is:

* `Failed`
* `Cancelled`

Each contributor can claim their refund once.

The contract tracks each contributor's recorded contribution and prevents the same contribution from being claimed repeatedly.

Refund flow:

```text
Contributor
     ↓
Claim Refund
     ↓
Contribution Returned
     ↓
Refund Cannot Be Claimed Again
```

Refunds are not available simply because a contributor changes their mind while the fund is still active.

---

# Fund States

The CommunityFund contract uses five primary states:

| State       | Meaning                                                   |
| ----------- | --------------------------------------------------------- |
| `Funding`   | The community is still contributing                       |
| `Funded`    | The target has been reached and spending can begin        |
| `Failed`    | The deadline passed without reaching the target           |
| `Completed` | The funded balance has been fully spent                   |
| `Cancelled` | The creator cancelled the fund while it was still funding |

General lifecycle:

```text
Funding
├── Target reached → Funded
├── Deadline missed → Failed
└── Creator cancellation → Cancelled

Funded
└── Approved spending requests → Completed when balance reaches zero
```

---

# Contract Rules

The smart contract enforces the core rules on-chain:

* Contributions must be greater than zero.
* Contributors cannot push the campaign above its target.
* The creator cannot directly withdraw contributed funds.
* Only contributors can approve spending requests.
* Each contributor receives one approval per spending request.
* The creator does not receive an automatic approval vote.
* The creator receives an approval vote only if they are also a contributor.
* Only the creator can create spending requests.
* The creator can cancel an unexecuted spending request.
* Anyone can execute a sufficiently approved spending request.
* An execution can transfer only the request's specified amount.
* Funding can fail after the deadline if the target was not reached.
* Contributors can claim refunds from failed or cancelled funds.
* Each contributor can claim a refund only once.
* A fully spent fund transitions to `Completed`.

---

# What the Contract Does Not Use

BotCommunityFund is **not** a rotating savings or payout-round system.

The contract does not use:

* Rotating recipients
* Member payout rounds
* Direct owner withdrawals
* Hidden administrator withdrawal paths
* Contribution-weighted voting
* Multiple approvals from the same contributor for one request

The system instead uses:

```text
Community Funding
        +
Equal Contributor Voting
        +
On-chain Spending Requests
        +
Transparent Execution
        +
Controlled Refunds
```

---

# Guidelines

The frontend includes an in-app **Guidelines** page explaining the fund lifecycle and contract rules in user-friendly terms.

The Guidelines cover:

* Fund creation
* Community contributions
* Target completion
* Creator and contributor roles
* Approval rules
* Spending requests
* Execution
* Fund movement
* Failed funding
* Refunds
* Cancellation
* Fund states
* Transaction checklist

Users should review the Guidelines before interacting with a fund.

---

# Frontend Blockchain Integration

The frontend reads and interacts with the deployed CommunityFund contract using:

* wagmi
* viem
* TanStack Query
* Reown AppKit

The application can display blockchain-backed fund information and prepare contract interactions through the connected wallet.

Wallet connection is handled through Reown AppKit.

The frontend does not hold or manage user private keys.

---

# Security Principles

BotCommunityFund is designed around the following principles:

### Funds remain in the contract

Contributions are held by the smart contract rather than transferred to the creator's personal wallet.

### Rules are enforced on-chain

Important authorization and spending conditions are enforced by Solidity rather than relying only on frontend restrictions.

### Equal voting

Each contributor receives one approval vote per spending request regardless of contribution amount.

### No arbitrary creator withdrawal

The creator cannot simply withdraw the community balance.

### Explicit spending

Funds move through spending requests with a defined recipient and amount.

### One-time refunds

The contract records refund claims so the same contribution cannot be refunded repeatedly.

---

# Development

Install dependencies and build the frontend:

```powershell
cd frontend
npm install
npm run build
```

Run the frontend locally:

```powershell
npm run dev
```

Build and test the smart contract:

```powershell
cd ../contract

forge build
forge test
```

---

# Environment Files

Environment files containing secrets must never be committed.

The repository ignores:

```text
.env
.env.*
```

while allowing:

```text
.env.example
```

Example environment files should contain variable names and placeholder values only.

Never commit:

* Private keys
* Wallet seed phrases
* API secrets
* Reown secrets
* Deployment credentials

---

# Git-Ignored Build and Contract Artifacts

The repository intentionally ignores generated and dependency-heavy directories such as:

```text
node_modules/
dist/
contract/lib/
broadcast/
cache/
out/
```

These files should be regenerated locally when required.

---

# Current Deployment Status

The project has progressed beyond the initial development-only stage.

### Completed

* Smart contract implemented
* Contract tests added
* Deployment script prepared
* ABI generated
* Frontend blockchain integration implemented
* Frontend environment configuration prepared
* CommunityFund deployed to Bohr Testnet
* Deployed contract address configured
* Frontend redeployed with the active contract address
* Contract source flattened
* Explorer verification completed for the active deployment
* In-app Guidelines page added
* Fund lifecycle and permissions documented
* Responsive frontend layout implemented

### Remaining Validation

Some live interactions still require a browser wallet/session and suitable test state.

Remaining validation includes:

* Connect a browser wallet
* Test live contributions
* Test spending request creation
* Test contributor approvals
* Test execution after approval threshold
* Test refund flow with a failed or cancelled fund
* Perform final end-to-end validation across the frontend and deployed contract

Some operations cannot be tested against an already-funded/completed test state without creating another suitable test fund.

---

# Current Deployment Reference

For the current active deployment:

```text
Network:
Bohr Testnet

Chain ID:
968

Contract:
0xd9E23Ab2C75b14F2D15DA1e928EB380ccd469312

Explorer:
https://scan.bohr.life/

RPC:
https://rpc.bohr.life
```

---

# Development Workflow

A typical development workflow is:

```text
1. Modify Solidity contract
        ↓
2. forge build
        ↓
3. forge test
        ↓
4. Regenerate ABI
        ↓
5. Update frontend integration if required
        ↓
6. npm run build
        ↓
7. Deploy a new contract when required
        ↓
8. Update frontend contract address
        ↓
9. Verify deployment
        ↓
10. Test frontend + contract interaction
```

When the smart contract changes, the ABI and deployment address may also need to be updated.

---

# Project Goal

BotCommunityFund aims to provide a transparent mechanism for communities to collectively fund projects without requiring members to blindly trust a central holder of the funds.

The smart contract defines:

```text
Who can contribute
Who can approve
Who can create spending requests
Who can execute payments
When funding can fail
When refunds are available
When a fund can be cancelled
When a fund becomes completed
```

The result is a community fund where the important financial rules are visible and enforced by the blockchain.

---

# License

This project is currently being developed as a community Web3 application on the Bohr Testnet.
