# AccordBridge Frontend

[![Frontend checks](https://github.com/accordbridge-labs/accordbridge-frontend/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/accordbridge-labs/accordbridge-frontend/actions/workflows/ci.yml)
[![Dependency advisories](https://github.com/accordbridge-labs/accordbridge-frontend/actions/workflows/dependency-advisories.yml/badge.svg?branch=main)](https://github.com/accordbridge-labs/accordbridge-frontend/actions/workflows/dependency-advisories.yml)

## What is AccordBridge Frontend?

AccordBridge Frontend is the client and freelancer interface for creating projects, agreeing on versioned terms, tracking delivery, and reviewing work. It connects to the [AccordBridge backend](https://github.com/accordbridge-labs/accordbridge-backend) for accounts and saved project data, and offers an optional Freighter-powered Stellar testnet escrow flow.

> **Status: development / testnet prototype.** This is not a production payment service. No real-money integration exists. The saved workspace, testnet escrow, and `/demo` simulator are separate experiences. Hosted wallet acceptance is not established; see the [hosted acceptance checklist](docs/HOSTED-ACCEPTANCE.md), the [run kit](docs/evidence/HOSTED-RUN-KIT.md) and its [blank 27 November recording sheet](docs/evidence/hosted-acceptance-2026-11-27.md). Dependency-advisory scope and triage are documented in [DEPENDENCY-ADVISORIES.md](docs/DEPENDENCY-ADVISORIES.md).

## Contents

- [Scope and boundaries](#scope-and-boundaries)
- [Core Features](#core-features)
- [Rules the UI keeps](#rules-the-ui-keeps)
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
- [Verification status](#verification-status)
- [Checks](#checks)
- [Before real value](#before-real-value)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Scope and boundaries

This repository owns the browser experience only. The backend owns identity,
access control, persisted workflow state, transaction intents and reconciliation;
the Soroban contracts own escrow custody and settlement authorization.

| Area | This repository does | This repository does not |
| --- | --- | --- |
| Accounts and workspace | Render registration/login and participant-scoped project views through the API proxy. | Store passwords, sessions, or private project data locally. |
| Agreements | Edit drafts, publish versions, accept terms, and display acceptance history. | Define financial rules or make a version binding on chain by itself. |
| Delivery and review | Submit versioned notes/links and record approval or revision decisions. | Fetch or preserve linked files, or arbitrate disputes. |
| Wallet and escrow | Prompt Freighter to sign backend-prepared transactions and display verified chain state. | Hold keys, sign silently, submit transactions, or decide settlement. |
| Simulator | Run `/demo` with in-memory fictional scenarios. | Touch the API, wallets, or the chain. |

The saved workspace, the testnet escrow panel and `/demo` are three separate
state paths. Do not read a simulator result as payment evidence.

## Core Features

- **Saved project workspace:** accounts, participant-only projects, private drafts, versioned agreements, and acceptance history.
- **Delivery and review:** versioned first-milestone submissions, HTTPS delivery links, client approval, and revision requests.
- **Stellar testnet escrow:** optional Freighter wallet verification, participant-signed transactions, test-token funding, release, and mutual refund.
- **Transaction recovery:** explicit chain-state checks for pending or interrupted submissions; the frontend does not blindly retry payment writes.
- **Payment simulator:** a separate `/demo` with fictional participants and illustrative payment scenarios. Its data resets on refresh and never reaches the backend or chain.

The testnet contract supports only the first milestone and uses ABUSD with no monetary value. Approval in the app is a workflow decision; chain reconciliation is required to confirm a payment.

## Rules the UI keeps

These properties are intentional. Each is enforced in code and covered by a
browser or unit test, so they survive refactoring.

| Rule | Where it lives | How it is pinned |
| --- | --- | --- |
| A payment write is never retried automatically. | `testnet-escrow.tsx` records the intent hash before submit and locks further actions while the outcome is unknown. | `tests/recovery.spec.ts` covers lost responses and refresh with zero automatic submits. |
| Release eligibility comes from the server, not cached component state. | The workspace refreshes escrow state after project or work changes. | `tests/save-refresh.spec.ts` and workflow specs assert the refreshed label. |
| Freighter acts only after an explicit user action. | `Connect & verify Freighter` signs a never-broadcast ownership challenge; signing is a separate button. | `tests/workflow.spec.ts` exercises the full signed flow; no silent reconnect exists. |
| The backend origin stays server-side. | `BACKEND_URL` is read only by the `/api` proxy and never renamed with `NEXT_PUBLIC_`. | Build/typecheck and code review; documented in Environment Setup. |
| Simulator state never reaches the API or chain. | `/demo` uses `src/lib/demo.ts` in memory. | `tests/demo-scenarios.spec.ts` runs the six fictional scenarios without API mutation. |
| Hosted wallet evidence must be observed, not inferred. | `docs/HOSTED-ACCEPTANCE.md` and the run kit require real hashes and balances. | Manual H01–H26 run; automated suites are recorded separately and remain **NOT RUN** for wallets. |

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

The backend authentication cookie is HttpOnly and shared by same-origin browser tabs. Each tab loads account/session state when the page opens and learns about expiry or sign-out when its next authenticated request is made. The frontend does **not** currently implement a custom cross-tab event channel for instantly synchronizing UI state.

The verified public wallet address is restored from the backend when the escrow panel loads. Freighter access is requested only when the user starts a wallet action; the app checks the selected address and Stellar Testnet network again before signing. There is no silent Freighter permission prompt or automatic signing/reconnect flow. If the active Freighter account or network changes, select the verified testnet account and start the intended action again.

## Security

- Authentication uses the backend's HttpOnly session cookie; the frontend does not keep session tokens in local storage.
- `BACKEND_URL` is server-only and the proxy disables caching, limits forwarded headers, and uses a request timeout.
- Mutations require the backend's exact `Origin` and anti-CSRF header checks. The frontend does not send a caller-supplied role or user ID to authorize project actions.
- Freighter signs transactions locally after explicit user action. Never enter wallet seed phrases or secret keys into AccordBridge.
- An interrupted write may have succeeded. Inspect saved state or use **Check transaction & chain state** before attempting another write.
- Testnet tokens have no monetary value. Mainnet payments, production wallet recovery, uploads, dispute resolution, and production operations are not implemented.

## Verification status

Honest accounting matters when the subject is escrow, even valueless escrow.

| Check | Result on `main` (27 Nov 2026) | What it establishes |
| --- | --- | --- |
| `npm test` | 16 passed | Isolated client logic, explicit read retries, non-replay classification. |
| `npm run test:e2e` | 48 passed (desktop + mobile) | Synthetic browser workflows and mocked failure handling. |
| `npm run test:workspace` | 4 passed in CI (one mobile timeout required a re-run) | Isolated backend/database persistence with synthetic chain snapshots. |
| `npm run build` / `npm run typecheck` | Passed | Production build and strict types. |
| `npm audit --json` | 0 advisories | Lockfile advisory scan; not an audit. |
| [App CI](https://github.com/accordbridge-labs/accordbridge-frontend/actions/runs/46078221845) · [Advisory CI](https://github.com/accordbridge-labs/accordbridge-frontend/actions/runs/46078221691) | Passed | Post-merge checks on the Apache-2.0 commits. |
| Hosted two-participant Freighter run H01–H26 | **NOT RUN** | No real wallet, signature, token movement or hosted chain verification has been performed here. |

Automated suites use synthetic chain state and do not drive the Freighter
extension. The manual procedure, blank recording sheet and completion gate are
in [HOSTED-ACCEPTANCE.md](docs/HOSTED-ACCEPTANCE.md),
[HOSTED-RUN-KIT.md](docs/evidence/HOSTED-RUN-KIT.md) and the
[27 November sheet](docs/evidence/hosted-acceptance-2026-11-27.md).

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

## Before real value

This interface is for a Testnet experiment with valueless ABUSD. Real-money
escrow would require, at minimum, a reviewed authority and dispute model, an
audit of the exact deployed contract, a real asset and mainnet deployment,
operational monitoring and recovery, legal/compliance decisions, and fresh
evidence. Those are future gates, not current capabilities. See the
[production escrow roadmap](https://github.com/accordbridge-labs/accordbridge-contracts/blob/main/docs/PRODUCTION-ESCROW-ROADMAP.md)
and the [readiness report](https://github.com/accordbridge-labs/.github/blob/main/docs/PROGRAM-READINESS.md).

Never describe an approved work submission, a mocked browser test or a clean
advisory scan as proof of payment, an audit, or hosted wallet acceptance.

## Roadmap

This prototype's documented next areas include multi-milestone delivery and escrow, private file storage, notifications, dispute handling, wallet recovery, and production operational/security work. Cross-tab UI synchronization and resilient wallet reconnection also need a defined product and security design. These are planned areas, not shipped features or committed delivery dates. Mainnet payments require a separate contract, asset, and operational review.

## Contributing

See the organization [contribution guide](https://github.com/accordbridge-labs/.github/blob/main/docs/START-HERE.md) before opening an issue or pull request. Keep simulator-only behavior separate from saved workspace and wallet paths, and update the relevant docs when API or user-facing flows change.

## License

This project is licensed under the [Apache License 2.0](LICENSE) with the attribution notices in [NOTICE](NOTICE). Third-party dependencies retain their own licenses and notices.
