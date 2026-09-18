# BotCommunityFund frontend

React + Vite + TypeScript foundation for BotCommunityFund.

```powershell
npm install
npm run dev
npm run build
npm run lint
```

The Bohr Testnet chain is centralized in `src/config/chains.ts`. Wallet provider setup lives in `src/config/appkit.ts`. Contract reads and writes live in `src/hooks/useCommunityFund.ts` and use the generated ABI at `src/abi/CommunityFund.json`.

When `VITE_COMMUNITY_FUND_CONTRACT_ADDRESS` is empty, the app remains in deployment-preparation mode instead of attempting contract reads. Add a valid address after Prompt 3 deployment. `VITE_REOWN_PROJECT_ID` is also optional for a local build; add it manually to enable the AppKit wallet control.

Reads use wagmi's TanStack Query integration. Writes expose submitted hash, confirmation, and error state; the UI only reports on-chain success after the receipt is confirmed.

Regenerate the ABI from the compiled Foundry artifact whenever `CommunityFund.sol` changes; see the root README for the PowerShell command.
