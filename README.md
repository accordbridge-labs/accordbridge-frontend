# AccordBridge Frontend

**Status: development/testnet prototype with hosted deployment configuration.** Next.js, React, TypeScript and Tailwind CSS provide authenticated projects backed by the NestJS/PostgreSQL service. The separate `/demo` route retains the sample payment simulator. Freighter wallet verification and experimental Stellar testnet escrow are available when configured on the backend.

**Public frontend URL:** https://accordbridge-frontend.vercel.app (listed as the upstream repository's homepage; availability and end-to-end readiness must be verified on the actual deployment). The connected API relies on the deployed Render backend and Neon/PostgreSQL configuration; hosting alone does not prove live wallet acceptance. Use the [hosted two-participant acceptance runbook](docs/HOSTED-ACCEPTANCE.md) to capture evidence.

## Run locally

Use Node.js 22.12+ or Node 24 LTS. First start the sibling [backend](https://github.com/accordbridge-labs/accordbridge-backend) following its README, including database setup and migrations.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. The frontend proxies `/api` to `http://127.0.0.1:4000` by default. To change that server-side target, copy `.env.example` to `.env.local` and set `BACKEND_URL`. Never expose it as a `NEXT_PUBLIC` variable. The backend's `FRONTEND_ORIGIN` must exactly match the browser origin; `localhost` and `127.0.0.1` are different origins.

For hosted use, the frontend is configured for Vercel and the companion backend documents Render/PostgreSQL hosting. Confirm that `BACKEND_URL`, backend `FRONTEND_ORIGIN`, secure session cookies and actual deploy health match the current stable frontend URL. Do not assume a green deployment is evidence of two-wallet testnet readiness.

## Try the persistent workspace

1. Create an account with a name, email and a password of at least 12 characters. Email is a login identifier; email verification and recovery are not yet available.
2. Have your project partner register in a different browser profile or private window. Each account can reveal its ID with **Show my account ID**.
3. Choose **New project**, supply the other account ID, and choose your role. Roles and participants are fixed after creation. No invitation email is sent.
4. Enter milestones, dates, scope and acceptance criteria. **Save draft & close** saves a private draft to your account; refresh and resume it to verify persistence.
5. **Send for review** publishes an immutable version for both participants. Each must sign in to their own account to accept. There is no role switch in the saved workspace.
6. **Propose changes** publishes a new version with fresh acceptance required. Previous versions retain their own acceptance records. A stale save or acceptance receives a conflict rather than silently overwriting newer terms.

The workspace supports multiple projects. Only participants see their projects, and each author's unpublished drafts remain private. Sessions use HttpOnly cookies, not browser storage tokens. Sign-out revokes the server session. Edited text is not saved until a save or publish request succeeds; unsaved edits are lost on refresh. A conflict keeps the editor visible and offers an explicit reload/discard action.

If the backend is asleep or an API response is interrupted, entered project, agreement and delivery fields remain visible while the page stays open. Select **Check connection** for a bounded, user-initiated health read; it does not retry any project/account modification. A timed-out write may already have been committed: inspect saved state before manually deciding what to do next. Do not refresh away unsaved fields unless you have copied or saved them.

Accounts and agreement data persist in PostgreSQL. First-milestone test-token funding, release and mutual refund are connected. Versioned first-milestone delivery links, client review and revision requests are connected. Agreements currently use proposed development terms, not final live escrow policies. No funds move when accepting.

## Payment demo

Open `/demo` or **Explore payment demo**. It has fictional Maya/Tobi role controls and a single replaceable sample project. All its data stays in memory and resets on refresh. Nothing from this route is imported into your saved projects, and simulated payment states never update the backend.

The demo covers editable agreements, acceptance, the first milestone's simulated funding, versioned submissions, revisions, approval, payout confirmation and receipt. Unknown funding outcomes cannot start another deposit. Disputes retain funds and stop at a pending decision. Later milestones remain unfunded. Paid scope changes, cancellation settlement and review timers remain outstanding.

Demo prices use integer cents for display calculations and a 0.3% illustrative provider fee rounded to cents. This is not a specification of Stellar asset precision or deployed contract fee logic. Resolver, cancellation, appeal and final pricing terms remain unresolved.

## Checks

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:workspace
```

The demo suite starts the production frontend on port 3100. The connected suite requires the sibling backend to be built, `.env.test` configured for its isolated test database, and PostgreSQL running. It starts a separate API on port 4100 and a frontend proxy on port 3100; the development services remain untouched. Run these two browser suites sequentially because they use the same frontend test port.

Connected browser checks use two authenticated accounts to save/resume drafts across refresh, publish and accept versions, revise terms, sign out and sign back in on desktop and mobile Chromium viewports. Test fixtures are synthetic and stay only in the test database. The recovery browser tests stub HTTP and stored **public intent identifiers**; they do not sign Freighter transactions. Backend tests separately verify access denial, conflicts, session revocation and persistence across an application restart.

**Live evidence is separate:** The hosted [manual runbook](docs/HOSTED-ACCEPTANCE.md) tracks two browser profiles, different Freighter Testnet wallets, test XLM, ABUSD funding, real testnet confirmations and transaction hashes. All unexecuted hosted checks are explicitly **NOT RUN**; local or mocked tests must never be called live wallet acceptance.

## Implementation boundaries

The frontend sends no caller role or user ID when accepting; the API derives both from the authenticated session and project membership. The same-origin proxy forwards only the required cookie, JSON, origin and anti-CSRF headers. Backend errors remain visible; an HTTP response is never presented as a chain payment.

Email verification, password recovery, invitations, account deletion, file uploads, mainnet payments, notifications and production operations are not implemented. Hosting is for a temporary, valueless-token testnet prototype only. Do not treat it as a production payment service until operational and security controls are reviewed.

## Documents

- [Hosted two-participant testnet acceptance checklist](docs/HOSTED-ACCEPTANCE.md)
- [Screen blueprint](docs/SCREENS.md)
- [Detailed prototype blueprint](docs/PROTOTYPE-BLUEPRINT.md)
- [Canonical product specification](https://github.com/accordbridge-labs/accordbridge-backend/blob/main/docs/PRODUCT.md)
- [API contract](https://github.com/accordbridge-labs/accordbridge-backend/blob/main/docs/openapi.json)
- [Contract evaluation](https://github.com/accordbridge-labs/accordbridge-contracts)

License selection is pending.

## Try Stellar testnet escrow

Configure the backend using its [testnet guide](https://github.com/accordbridge-labs/accordbridge-backend/blob/main/docs/TESTNET.md). In two desktop browser profiles, use separate Freighter wallets set to **Stellar Testnet**. Each participant links their wallet in a published project's escrow panel and signs a never-broadcast ownership proof. Wallet replacement is not implemented. Use the Friendbot link to obtain free test XLM for each wallet.

1. Both participants accept the same application agreement.
2. The client selects **Prepare milestone escrow**, reviews, signs, and uses **Check transaction & chain state** until deployment is confirmed. Preparing locks terms even if signing is cancelled.
3. Both participants choose **Approve terms with wallet**, sign and check confirmation.
4. The client gets ABUSD from the faucet, checks, prepares funding, signs and checks again. The interface shows funded only from a verified chain snapshot.
5. Submit and approve the first milestone’s work, then the client can release to the freelancer; alternatively, each participant approves a mutual refund. Check after every signature. A single refund vote does not move funds or freeze client release.

ABUSD has no monetary value and is not USDC. Existing nominal agreement amounts map to the same number of ABUSD only for this experiment. Only the first milestone is supported, with zero platform/provider fees and test-XLM network fees. There is no resolver, dispute freeze, automatic release, wallet recovery or storage-restoration workflow. This contract is unaudited and is not a production-provider selection.

Cancelled signing leaves one prepared intent that can be resumed. Unknown submission keeps the existing hash pending and blocks another action. If the browser loses a signed submission response, the page retains the **public intent ID and hash** in per-profile session storage across refresh and requires an explicit **Check transaction & chain state** before another signed action. No signed XDR or authentication secret is stored there. The backend must establish a confirmed, failed or verified expired result before the browser clears an uncertain submission; missing retained ledger history requires investigation. A last-checked timestamp is a snapshot, not continuous monitoring.

The backend and contracts record real testnet signature/transaction evidence. Automated browser checks do not drive the Freighter extension; manual extension approval remains a release check.

## Submit and review deliverables

After confirming first-milestone funding, the freelancer uses **Deliverables & review** to submit delivery notes and up to ten HTTPS links. The client refreshes the project, reviews the linked work against the accepted criteria, and approves or requests revisions with feedback. Revisions are capped by the agreement. Each resubmission preserves earlier versions and starts a new review deadline, shown in UTC.

Approval enables **Review release to freelancer**. This is a separate wallet action; work approval never represents payment confirmation. The current contract can still be called directly by the client without an app review. A review deadline does not automatically release tokens or start a dispute.

If actions are unavailable, use **Check transaction & chain state**: submission and review require a funded snapshot checked within five minutes, with no pending transaction. Work history remains visible after settlement.

Delivery links are shared with the project partner and open externally. AccordBridge stores the submitted URL and notes, not the file contents; grant destination access yourself. Uploads, immutable file evidence, notifications and multiple-milestone delivery remain future work.

The connected browser suite covers submission, revision, approval, preserved history and the separate release action on desktop and mobile, using synthetic chain snapshots in the isolated database. The recovery suite adds simulated backend delays and interrupted responses, not real extension approvals.

## Vercel deployment

Import this repository with Next.js, Node 24.x, root directory `.`, and the commands in `vercel.json`. Add the deployed API's HTTPS origin as **BACKEND_URL** in Vercel's Production environment, without `/api` or a trailing slash, then redeploy. This is a server-only variable. Do not upload local environment files or wallet fixture keys.

The companion backend includes `render.yaml` and a [step-by-step hosting guide](https://github.com/accordbridge-labs/accordbridge-backend/blob/main/docs/HOSTING.md). Backend FRONTEND_ORIGIN must match the stable Vercel production origin exactly. Preview URLs need their own backend/origin configuration. Free-tier storage/service limitations and cold starts make this a temporary testnet demo. Hosted cookie, wallet and payment checks are documented as **not executed** until a separate operator records actual [acceptance evidence](docs/HOSTED-ACCEPTANCE.md).
