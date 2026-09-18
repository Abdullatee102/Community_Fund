# BotCommunityFund

BotCommunityFund is a Web3 community crowdfunding and fund-management platform for shared projects.

Instead of a rotating savings model, contributors fund a defined community goal. The platform makes the fund's **purpose, target, progress, spending requests, approvals, releases, and refunds** transparent and verifiable on-chain.

Prompt 2 covers the smart contract, tests, deployment preparation, ABI generation, and frontend blockchain integration. **Deployment and live testing are reserved for Prompt 3.**

## Project Structure

```text
BotCommunityFund/
├── contract/      # Solidity + Foundry smart contract workspace
└── frontend/      # React + Vite + TypeScript frontend
```

### Frontend Stack

* React
* Vite
* TypeScript
* wagmi
* viem
* Reown AppKit
* TanStack Query

### Smart Contract Stack

* Solidity
* Foundry
* OpenZeppelin

## Network

The frontend is configured for **Bohr Testnet**.

| Property     | Value                     |
| ------------ | ------------------------- |
| Chain ID     | `968`                     |
| RPC          | `https://rpc.bohr.life`   |
| Native Token | `BOT`                     |
| Explorer     | `https://scan.bohr.life/` |
| Total Supply | 150 million BOT           |

## Getting Started

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Create your local environment file:

```powershell
Copy-Item .env.example .env.local
```

Then add your Reown Project ID when wallet connection is enabled.

> Never place private keys in frontend environment files.

The contract address is intentionally empty until deployment in Prompt 3.

After deployment, set:

```env
VITE_COMMUNITY_FUND_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
```

If the address is missing, the frontend remains in **preparation mode**.

## Smart Contract

From the `contract/` directory:

```powershell
forge install foundry-rs/forge-std --no-commit
forge build
forge test
```

### Deployment

Deployment is intentionally **not performed in Prompt 2**.

For Prompt 3, create a local ignored environment file:

```powershell
cd contract
Copy-Item .env.example .env
```

Configure the required deployment values:

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

The deployment script reports:

* Network
* Chain ID
* Deployer address
* Contract address
* Explorer information

**Do not run the deployment command until Prompt 3.**

## ABI Generation

After making contract changes, rebuild the contract and regenerate the frontend ABI:

```powershell
cd contract

forge build

$artifact = Get-Content out/CommunityFund.sol/CommunityFund.json -Raw | ConvertFrom-Json

$artifact.abi | ConvertTo-Json -Depth 100 | Set-Content ../frontend/src/abi/CommunityFund.json
```

## How the Fund Works

The platform follows a simple funding and approval lifecycle:

1. **Create** — A creator defines the fund title, metadata, target, deadline, and equal-vote approval configuration.
2. **Fund** — Contributors send BOT to the fund before the deadline.
3. **Funded** — Once the target is reached, the fund becomes `Funded` and the approval threshold is fixed to a simple majority of contributors.
4. **Request** — The creator can submit spending requests for specific amounts.
5. **Approve** — Each contributor can approve a spending request once.
6. **Release** — An approved request can transfer only its specified amount.
7. **Fail / Refund** — If the target is not reached before the deadline, the campaign can be marked `Failed`. Contributors can then claim their refunds once.
8. **Complete** — When the entire funded amount has been spent, the fund becomes `Completed`.

## Contract Rules

The smart contract enforces the core rules on-chain:

* Contributors cannot exceed the campaign target.
* The creator cannot withdraw funds directly.
* Spending requires contributor approval.
* Each contributor gets one approval per request.
* Approved requests can only release their specified amount.
* Failed campaigns allow contributors to claim refunds.
* Each contributor can claim a refund only once.
* Fully spent funds transition to `Completed`.

The contract does **not** use:

* Rotating recipients
* Member payout rounds
* Direct owner withdrawals
* Hidden administrator withdrawal paths

## Development Status

### Prompt 2 — Complete

* Smart contract implemented
* Contract tests added
* Deployment script prepared
* Frontend blockchain integration added
* ABI generated
* Environment configuration prepared
* Deployment intentionally deferred

### Prompt 3 — Next

* Deploy to Bohr Testnet
* Configure the deployed contract address
* Connect a browser wallet
* Test live contributions
* Test spending requests and approvals
* Test fund release
* Test refunds where applicable
* Complete explorer verification
* Perform final end-to-end validation
