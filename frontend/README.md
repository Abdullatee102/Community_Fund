# BotCommunityFund frontend

React + Vite + TypeScript foundation for BotCommunityFund.

```powershell
npm install
npm run dev
npm run build
npm run lint
```

The Bohr Testnet chain is centralized in `src/config/chains.ts`. Wallet provider setup lives in `src/config/appkit.ts`. Contract reads and writes live in `src/hooks/useCommunityFund.ts` and use the generated ABI at `src/abi/CommunityFund.json`.

Set `VITE_COMMUNITY_FUND_FACTORY_ADDRESS` to enable factory reads and fund creation. `VITE_COMMUNITY_FUND_CONTRACT_ADDRESS` is optional and selects the legacy/default fund instance; funds returned by the factory can be used directly without it. `VITE_REOWN_PROJECT_ID` is optional for a local build; add it manually to enable the AppKit wallet control.

Reads use wagmi's TanStack Query integration. Writes expose submitted hash, confirmation, and error state; the UI only reports on-chain success after the receipt is confirmed.

Regenerate the ABI from the compiled Foundry artifact whenever `CommunityFund.sol` changes; see the root README for the PowerShell command.
