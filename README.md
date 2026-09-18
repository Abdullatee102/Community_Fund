# BotCommunityFund

BotCommunityFund is a Web3 community crowdfunding and fund-management platform for shared projects. Contributors fund a defined community goal rather than participating in a rotating savings scheme. The intended product makes the purpose, target, progress, spending requests, approvals, releases, and refunds visible on-chain.

Prompt 2 implements the contract, tests, deployment preparation, generated ABI, and frontend blockchain integration. Deployment is intentionally deferred to Prompt 3.

## Structure

- `contract/`: Solidity and Foundry workspace, isolated from the frontend.
- `frontend/`: React, Vite, TypeScript, wagmi, viem, Reown AppKit, and TanStack Query application.

## Network

The centralized frontend configuration targets **Bohr Testnet**:

- Chain ID: `968`
- RPC: `https://rpc.bohr.life`
- Native token: `BOT`
- Explorer: `https://scan.bohr.life/`
- Total supply: `150 million BOT`

## Install and run

```powershell
cd frontend
npm install
npm run dev
```

Copy `frontend/.env.example` to `frontend/.env.local` and add the Reown Project ID when you are ready to enable wallet connection. Do not put private keys in frontend environment files.

The deployed contract address remains empty until Prompt 3. After deployment, set `VITE_COMMUNITY_FUND_CONTRACT_ADDRESS` in `frontend/.env.local`. The frontend validates the value and stays in preparation mode when it is missing.

## Contract commands

From `contract/`:

```powershell
forge install foundry-rs/forge-std --no-commit
forge build
forge test
```

Deployment is intentionally not performed in Prompt 2. Copy `contract/.env.example` to a local ignored `contract/.env`, provide the deployment values manually, then use:

```powershell
cd contract
forge script script/DeployCommunityFund.s.sol:DeployCommunityFund --rpc-url $env:BOT_RPC_URL --broadcast
```

The deploy script reads `BOT_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, `COMMUNITY_FUND_TITLE`, `COMMUNITY_FUND_METADATA_URI`, `COMMUNITY_FUND_TARGET`, and `COMMUNITY_FUND_DEADLINE`. It logs network, chain ID, deployer, contract, and explorer information. Do not run this command until Prompt 3.

Regenerate the frontend ABI after contract changes:

```powershell
cd contract
forge build
$artifact = Get-Content out/CommunityFund.sol/CommunityFund.json -Raw | ConvertFrom-Json
$artifact.abi | ConvertTo-Json -Depth 100 | Set-Content ../frontend/src/abi/CommunityFund.json
```

## Architecture direction

1. A creator defines one community fund with a title, metadata reference, target, deadline, and equal-vote approval configuration.
2. Contributors send BOT to the fund before the deadline; overfunding is rejected.
3. Reaching the target moves the fund to `Funded` and fixes the approval threshold to a simple majority of contributors.
4. The creator can submit spending requests, but cannot withdraw directly.
5. Each contributor has one approval per request. Approved requests can transfer only their specified amount.
6. An unfinished campaign can be marked `Failed` after its deadline, or cancelled by the creator while still funding; contributors claim each refund once.
7. A fully spent fund becomes `Completed`.

The contract enforces these rules directly, with no rotating recipients, member payout rounds, owner withdrawal, or hidden administrator path.

Prompt 2 is deployment preparation. Prompt 3 is the separate step for deploying this reviewed build to BOT Testnet and performing live tests.
