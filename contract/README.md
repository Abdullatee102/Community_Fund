# Contract

Foundry workspace for BotCommunityFund. `CommunityFund` is one isolated fund per contract instance. It models a community goal, native BOT contributions, contributor approvals, constrained spending requests, and refunds for failed or cancelled campaigns.

## Lifecycle and rules

- `Funding`: contributors can send native BOT before the deadline. Contributions cannot exceed the target.
- `Funded`: reaching the exact target fixes a simple-majority approval threshold (`contributors / 2 + 1`).
- `Failed`: anyone can mark an unfinished campaign failed at or after the deadline. Contributors can claim their recorded contribution once.
- `Cancelled`: only the creator can cancel while the fund is still `Funding`; contributors can claim refunds.
- `Completed`: spending the entire balance through an approved request marks the fund completed.

The creator can create and cancel spending requests only within these rules. Contributors have equal voting weight regardless of contribution size. The creator is not given an arbitrary withdrawal function. A request is marked executed before its external native-token transfer and all execution/refund paths use `ReentrancyGuard`.

Metadata and expense descriptions are stored as URI references rather than large on-chain documents. No rotating payouts, savings rounds, or turn-based member distribution exist.

## Setup

```powershell
forge install foundry-rs/forge-std --no-git
forge install OpenZeppelin/openzeppelin-contracts --no-git
forge build
forge test -vvv
```

For Prompt 3, create a local ignored `.env` from `.env.example` with `DEPLOYER_PRIVATE_KEY`, `BOT_RPC_URL`, `COMMUNITY_FUND_TITLE`, `COMMUNITY_FUND_METADATA_URI`, `COMMUNITY_FUND_TARGET`, and `COMMUNITY_FUND_DEADLINE`. Then use:

```powershell
forge script script/DeployCommunityFund.s.sol:DeployCommunityFund --rpc-url $env:BOT_RPC_URL --broadcast
```

Do not run deployment as part of Prompt 2. Bohr Testnet uses chain ID `968`, RPC `https://rpc.bohr.life`, native token `BOT`, and explorer `https://scan.bohr.life/`.
