# AccordBridge Frontend

[![Frontend checks](https://github.com/accordbridge-labs/accordbridge-frontend/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/accordbridge-labs/accordbridge-frontend/actions/workflows/ci.yml)

## What is AccordBridge Frontend?

AccordBridge Frontend is the client and freelancer interface for creating projects, agreeing on versioned terms, tracking delivery, and reviewing work. It connects to the [AccordBridge backend](https://github.com/accordbridge-labs/accordbridge-backend) for accounts and saved project data, and offers an optional Freighter-powered Stellar testnet escrow flow.

> **Status: development / testnet prototype.** This is not a production payment service. No real-money integration exists. The saved workspace, testnet escrow, and `/demo` simulator are separate experiences. Hosted wallet acceptance is not established; see the [hosted acceptance checklist](docs/HOSTED-ACCEPTANCE.md).

## Contents

- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Available Pages](#available-pages)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running](#running)
- [Component Guide](#component-guide)
- [Architecture Notes](#architecture-notes)
- [Cross-Tab Wallet Session Sync & Auto-Reconnect](#cross-tab-wallet-session-sync-auto-reconnect)
- [Security](#security)
- [Checks](#checks)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Core Features

- **Saved project workspace:** accounts, participant-only projects, private drafts, versioned agreements, and acceptance history.
- **Delivery and review:** versioned first-milestone submissions, HTTPS delivery links, client approval, and revision requests.
- **Stellar testnet escrow:** optional Freighter wallet verification, participant-signed transactions, test-token funding, release, and mutual refund.
- **Transaction recovery:** explicit chain-state checks for pending or interrupted submissions; the frontend does not blindly retry payment writes.
- **Payment simulator:** a separate `/demo` with fictional participants and illustrative payment scenarios. Its data resets on refresh and never reaches the backend or chain.

The testnet contract supports only the first milestone and uses ABUSD with no monetary value. Approval in the app is a workflow decision; chain reconciliation is required to confirm a payment.

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework and routing | Next.js 16, React 19, App Router |
| Language | TypeScript |
| Styling | Tailwind CSS 4 and project CSS |
| Wallet integration | `@stellar/freighter-api` for Stellar Testnet access and signing |
| Unit tests | Node test runner through `tsx` |
| Browser tests | Playwright |
| Hosting configuration | Vercel |

The project requires Node.js **22.12 or later**. See `package.json` for the installed dependency versions and available scripts.

## Available Pages

| Path | Purpose | Backend required? |
| --- | --- | --- |
| `/` | Registration/login, saved project list, agreements, delivery/review, and testnet escrow panel. | Yes, for account and saved workspace features. |
| `/demo` | In-memory sample project and payment scenarios for exploring interface flows. | No. The simulator is local to the page and is not connected to wallets. |
| `/api/*` | Same-origin server-side proxy for supported backend routes. | Yes. Proxies to `BACKEND_URL`. |

## Project Structure

```text
src/
├── app/
│   ├── page.tsx                 # Saved workspace and account flows
│   ├── demo/page.tsx            # Isolated payment simulator
│   ├── api/[...path]/route.ts   # Same-origin backend proxy
│   ├── layout.tsx               # Root layout and metadata
│   ├── globals.css              # Shared styles and design tokens
│   └── workspace.css            # Workspace-specific styles
├── components/
│   ├── account-id.tsx           # Participant account ID display/copy
│   ├── agreement-editor.tsx     # Agreement draft and summary UI
│   ├── connection-check.tsx     # User-initiated safe connectivity check
│   ├── demo-scenarios.tsx       # Simulator-only scenarios
│   ├── testnet-escrow.tsx       # Freighter and testnet transaction flow
│   └── work-review.tsx          # Delivery submissions and client review
└── lib/
    ├── agreement.ts             # Agreement types and amount helpers
    ├── api.ts                   # Same-origin API client and error outcomes
    ├── connection.ts            # Safe read retry helper
    └── demo.ts                  # In-memory simulator state and transitions
tests/                           # Playwright browser scenarios
docs/                             # Screen guides, demo scenarios, hosted evidence
```

## Getting Started

The `/demo` simulator can run on its own. The saved workspace at `/` needs the companion [backend](https://github.com/accordbridge-labs/accordbridge-backend), PostgreSQL, and database migrations. Follow the backend README to start its local API before launching this frontend.

### Requirements

- Node.js 22.12 or later and npm.
- The AccordBridge backend for registration, saved projects, and work review.
- A deployed testnet contract and configured backend only if you want to try testnet escrow.

## Installation

```sh
npm ci
```

## Environment Setup

The frontend uses a same-origin `/api` proxy. By default it forwards requests to `http://127.0.0.1:4000`; no environment file is needed for the default local setup.

To use a different backend, copy [`.env.example`](.env.example) to `.env.local` and set:

| Variable | Purpose | Example |
| --- | --- | --- |
| `BACKEND_URL` | Server-side backend origin, without `/api` or a trailing slash. | `https://api.example.com` |

`BACKEND_URL` must remain server-side. Do not rename it to `NEXT_PUBLIC_BACKEND_URL` or expose it in browser code. Configure the backend's `FRONTEND_ORIGIN` to exactly match the browser origin; `localhost` and `127.0.0.1` are different origins.

## Running

### Development

```sh
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The demo is available at `/demo`; the saved workspace uses the backend API at `/api`.

### Production build

```sh
npm run build
npm start
```

For Vercel, set `BACKEND_URL` in the Production environment to the backend's HTTPS origin. Configure the backend's `FRONTEND_ORIGIN` to the deployed frontend origin, then deploy. Preview deployments need a matching origin configuration. See the backend [hosting guide](https://github.com/accordbridge-labs/accordbridge-backend/blob/main/docs/HOSTING.md).

## Component Guide

| Component | Role |
| --- | --- |
| `AccountId` | Displays and copies the account ID participants share to create a project. |
| `AgreementEditor` / `AgreementSummary` | Edits drafts and presents agreement versions and terms. |
| `WorkReview` | Creates delivery submissions and records client approval or revision requests. |
| `TestnetEscrow` | Links a verified wallet, prepares transactions, invokes Freighter signing, and checks reconciled testnet state. |
| `ConnectionCheck` | Runs a bounded, user-initiated health read; it does not retry writes. |
| `DemoScenarios` | Renders additional fictional payment scenarios on `/demo` only. |

## Architecture Notes

```text
Browser UI ── /api same-origin proxy ──> AccordBridge backend ──> PostgreSQL
    │                                        │
    └──── Freighter signs unsigned XDR ──────┴──> Soroban Testnet
```

- The frontend owns presentation and user-initiated wallet prompts. The backend owns authentication, access checks, persisted workflow state, transaction intents, and chain reconciliation.
- The proxy forwards only the required cookie, origin, JSON, and anti-CSRF headers. It does not expose the backend origin to browser JavaScript.
- The browser signs prepared transactions through Freighter. Wallet private keys and signed XDR are not stored by the frontend application. Session storage may retain a public intent ID and transaction hash so an interrupted submission can be checked safely.
- The saved workspace and `/demo` use separate state paths. The simulator does not call the API, connect to Freighter, or broadcast transactions.
- An API response or work approval is not proof of payment. The UI shows escrow as funded or settled only after the backend reports a verified chain snapshot.

## Cross-Tab Wallet Session Sync & Auto-Reconnect

**Wallet connection is implemented** for the optional Stellar testnet escrow flow. This section covers two separate convenience behaviors: instant cross-tab UI synchronization and automatic Freighter reconnection.

The backend authentication cookie is HttpOnly and shared by same-origin browser tabs. Each tab loads account/session state when the page opens and learns about expiry or sign-out when its next authenticated request is made. The frontend does **not** currently implement a custom cross-tab event channel for instantly synchronizing UI state.

The verified public wallet address is restored from the backend when the escrow panel loads. Freighter access is requested only when the user starts a wallet action; the app checks the selected address and Stellar Testnet network again before signing. There is no silent Freighter permission prompt or automatic signing/reconnect flow. If the active Freighter account or network changes, select the verified testnet account and start the intended action again.

## Security

- Authentication uses the backend's HttpOnly session cookie; the frontend does not keep session tokens in local storage.
- `BACKEND_URL` is server-only and the proxy disables caching, limits forwarded headers, and uses a request timeout.
- Mutations require the backend's exact `Origin` and anti-CSRF header checks. The frontend does not send a caller-supplied role or user ID to authorize project actions.
- Freighter signs transactions locally after explicit user action. Never enter wallet seed phrases or secret keys into AccordBridge.
- An interrupted write may have succeeded. Inspect saved state or use **Check transaction & chain state** before attempting another write.
- Testnet tokens have no monetary value. Mainnet payments, production wallet recovery, uploads, dispute resolution, and production operations are not implemented.

## Checks

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:workspace
```

The connected workspace browser suite needs the sibling backend, PostgreSQL, and an isolated test database. It starts its own API and frontend on ports 4100 and 3100. The demo and workspace browser suites both use port 3100, so run them sequentially. Browser wallet fixtures are synthetic and do not automate Freighter or establish live wallet acceptance. See the [hosted acceptance checklist](docs/HOSTED-ACCEPTANCE.md) for manual testnet evidence.

## Roadmap

This prototype's documented next areas include multi-milestone delivery and escrow, private file storage, notifications, dispute handling, wallet recovery, and production operational/security work. Cross-tab UI synchronization and resilient wallet reconnection also need a defined product and security design. These are planned areas, not shipped features or committed delivery dates. Mainnet payments require a separate contract, asset, and operational review.

## Contributing

See the organization [contribution guide](https://github.com/accordbridge-labs/.github/blob/main/docs/START-HERE.md) before opening an issue or pull request. Keep simulator-only behavior separate from saved workspace and wallet paths, and update the relevant docs when API or user-facing flows change.

## License

This project is licensed under the [MIT License](LICENSE). Third-party dependencies retain their own licenses and notices.
