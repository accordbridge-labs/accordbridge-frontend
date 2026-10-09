# Hosted two-participant wallet & escrow acceptance

**Execution status: NOT RUN.** This document is a manual test procedure, not evidence that the public deployment or Freighter flow has passed. Do not convert a checklist entry to PASS without observing it on the hosted Vercel/Render/Neon environment and retaining the allowed evidence below.

**Published frontend URL:** https://accordbridge-frontend.vercel.app (repository homepage; reachability must be confirmed during the run). The API origin is the separately configured Render URL; do not put its database connection string or private environment variables into evidence. The backend is documented in [HOSTING](https://github.com/accordbridge-labs/accordbridge-backend/blob/main/docs/HOSTING.md) and [TESTNET](https://github.com/accordbridge-labs/accordbridge-backend/blob/main/docs/TESTNET.md).

## Test boundaries

- **Manual live-testnet only:** Two different desktop browser profiles (not just tabs), two different AccordBridge application accounts, and two different installed/unlocked Freighter wallets set to **Stellar Testnet**. No simulated wallet injection for these checks.
- **Valueless assets only:** Free Friendbot test XLM for fees and experimental faucet ABUSD. ABUSD is *not* USDC or a real-money asset. Do not use mainnet addresses, mainnet tokens, real funds, or production credentials.
- **Privacy:** Never record passwords, session cookies, access tokens, signing payloads, signed XDR, recovery phrases, private keys, .env files, or unredacted DevTools headers. Public testnet transaction hashes, testnet contract IDs, public wallet addresses, and scrubbed screenshots are acceptable.
- **Automated checks are separate:** `npm test` and `npm run test:e2e` use synthetic data/mocked chain state; `npm run test:workspace` uses isolated backend fixtures. None of these automate Freighter authorization or prove public hosting. Record their results in a separate automated-evidence section.
- Run against a pinned git commit and the stable public production URL, not a temporary Vercel preview URL. If the backend database was reset or the Vercel/Render configuration changed, start a fresh run rather than treating stale snapshots as fresh verification.

## Evidence header (complete for each run)

| Field | Observed value |
| --- | --- |
| Test status | **NOT RUN** |
| UTC start/end timestamps | NOT RECORDED |
| Frontend URL actually opened | NOT VERIFIED |
| Render backend hostname / health observation (public only) | NOT VERIFIED |
| Frontend tested commit SHA | NOT RECORDED |
| Backend / contracts tested commit SHAs | NOT RECORDED |
| Browser A name, version, OS, profile ID (non-sensitive) | NOT RECORDED |
| Browser B name, version, OS, profile ID (non-sensitive) | NOT RECORDED |
| Freighter A version, selected **Testnet** network, public G-address | NOT RECORDED |
| Freighter B version, selected **Testnet** network, public G-address | NOT RECORDED |
| Separate application account IDs (not credentials) | NOT RECORDED |
| Project ID / agreement version | NOT RECORDED |
| Escrow contract ID / test ABUSD contract ID | NOT RECORDED |
| Recorder / reviewer | NOT RECORDED |

Record a UTC observation time, *actual* result (PASS / FAIL / BLOCKED / NOT RUN), redacted evidence filename, and public testnet transaction hash for **each** step. A transaction hash without an on-chain status and correct resulting balance is not a PASS. Use `N/A – off-chain` for steps where no transaction exists.

## Two-profile acceptance procedure

Each row begins **NOT RUN**, even if local/browser tests have passed. Save a distinct evidence entry for every row. Do not upload any secrets or wallet screenshots showing seed phrases.

| ID | Actor(s) | Manual action and expected observation | Result | Public testnet hash |
| --- | --- | --- | --- | --- |
| H01 | A + B | Open the stable frontend in separate profiles. Capture actual browser and Freighter versions and tested commit. Verify both profiles use different app accounts and wallet addresses. | NOT RUN | N/A |
| H02 | A + B | Sign in independently; reload each profile and confirm session persistence and account separation. Sign out B; verify B is signed out without affecting A, then sign B back in. | NOT RUN | N/A |
| H03 | A | Create a project addressed to B's application account ID, prepare a draft, save, refresh and resume. Confirm title, scope, criteria and milestones persist. | NOT RUN | N/A |
| H04 | A + B | Publish the agreement version; both users independently accept *the same version*. Verify neither acceptance signs or transfers on-chain funds. | NOT RUN | N/A |
| H05 | A | Link Freighter wallet A. Check Testnet network, sign the never-broadcast ownership challenge and verify the account-specific linked public address. | NOT RUN | N/A – proof not broadcast |
| H06 | B | Independently link different Freighter wallet B by challenge/verification. Confirm A's account does not claim B's wallet and vice versa. | NOT RUN | N/A – proof not broadcast |
| H07 | A + B | With Freighter on the wrong network, attempt a wallet action. Observe an actionable Testnet warning and **no** network submission. Restore correct network. | NOT RUN | N/A |
| H08 | A + B | Switch to the wrong account within Freighter and attempt a signature. Verify the wallet-address mismatch is rejected without sending. Restore the verified address. | NOT RUN | N/A |
| H09 | A + B | Request free test XLM via Friendbot for **both** G-addresses. Observe account activation/test XLM in a Testnet explorer. | NOT RUN | Friendbot TX A: NOT RECORDED; B: NOT RECORDED |
| H10 | A | Prepare escrow deployment, then cancel Freighter signing. Verify prepared intent remains recoverable, no submission is claimed, and another payment action is blocked. | NOT RUN | N/A |
| H11 | A | Refresh while an intent is pending; verify pending action, hash/state and safe next step remain visible. Confirm no automatic resubmission. | NOT RUN | NOT RECORDED |
| H12 | A | Resume or reprepare only as the verified backend intent permits. Approve a deployment signature and use **Check transaction & chain state** until the contract ID and verified state appear. | NOT RUN | NOT RECORDED |
| H13 | A | Sign on-chain escrow terms approval with wallet A; check its transaction and verified `clientAccepted` status. | NOT RUN | NOT RECORDED |
| H14 | B | Sign independently with wallet B; check the verified `freelancerAccepted` status. Verify neither user can approve on behalf of the other. | NOT RUN | NOT RECORDED |
| H15 | A | Request **valueless** ABUSD from the configured test faucet. Verify the faucet transaction and token balance, not merely the request response. | NOT RUN | NOT RECORDED |
| H16 | A | Prepare/sign funding for the first milestone. Confirm full intended pot in escrow using a fresh checked on-chain balance and ensure no duplicate funding action is enabled while pending. | NOT RUN | NOT RECORDED |
| H17 | B | Submit delivery notes and HTTPS links. Refresh and verify the client sees the submission and original content. | NOT RUN | N/A |
| H18 | A + B | A requests revisions with feedback. B submits revised notes/links. Verify submission history and review deadline are preserved. | NOT RUN | N/A |
| H19 | A | Approve submitted work. Verify approval does **not** release ABUSD, and the release requires a separate wallet action. | NOT RUN | N/A |
| H20 | A | Separately review, sign and submit release with A's Freighter wallet; check the *existing* transaction to confirmation. Verify held escrow balance decreases and B receives the expected full test-token amount. | NOT RUN | NOT RECORDED |
| H21 | A + B | Check final status (released), frozen terms, escrow and recipient balances from a fresh chain snapshot. Confirm no second release/funding can be initiated. | NOT RUN | NOT RECORDED |
| H22 | A | Simulate or encounter a Render cold start on a **safe read**. The app must show service unavailable while retaining entered form fields. Click **Check connection**, observe bounded read retries and successful manual recovery. | NOT RUN | N/A |
| H23 | A | Test an interrupted write response in a controlled **valueless** test setup. Verify the interface does not automatically repeat the mutation. Read saved project or existing intent before taking further action. | NOT RUN | Existing hash: NOT RECORDED |
| H24 | A | Interrupt the network response **after a testnet transaction has been sent**, using a controlled test environment only. Verify outcome is shown as **unknown**, the pending intent survives a refresh and signing/payment remains locked until explicit chain reconciliation. | NOT RUN | Existing hash: NOT RECORDED |
| H25 | A | For a confirmed failed or verified expired intent, use **Check transaction & chain state** and verify the backend has enough ledger history to declare it terminal. Do not unlock a replacement action while confirmation/history is insufficient. | NOT RUN | NOT RECORDED |
| H26 | A + B | Verify an inaccessible service or unknown transaction is never presented as a successful transfer. Record exact user-visible error/progress and the safest recovery route. | NOT RUN | N/A |

### Recording a check

Use one record per step, for example:

```text
Check ID: H__
Status: NOT RUN | PASS | FAIL | BLOCKED
UTC observed at: NOT RECORDED
Browser/profile + Freighter version: NOT RECORDED
Frontend/backend/contract commits: NOT RECORDED
Expected:
Actually observed:
Public Stellar Testnet transaction hash: NOT RECORDED / N/A
Testnet explorer verification (status, amount, parties): NOT RECORDED / N/A
Scrubbed screenshot or trace filename (optional): NOT RECORDED
Blocker, follow-up and reviewer:
```

Do not include cookie contents or HTTP authorization headers in Playwright traces or browser-network exports. Redact emails and any unnecessary private personal information before sharing evidence. Failed and blocked steps must stay visibly failed/blocked; never infer PASS from a passing local fixture.

## Automated evidence (separate from hosted execution)

| Suite | What it establishes | Current hosted status |
| --- | --- | --- |
| `npm test` | Isolated client logic, bounded explicit read retries and non-replay classification of lost write responses | NOT RUN HERE; not live evidence |
| `npm run test:e2e` | Synthetic browser workflows and mocked cold start / intent refresh behavior | NOT RUN HERE; no Freighter extension |
| `npm run test:workspace` | Database-backed project persistence and synthetic escrow chain snapshots in isolated local backend | NOT RUN HERE; not real testnet |
| Hosted two-profile checklist H01–H26 | Actual Vercel, Render/Neon, Freighter extension and Stellar Testnet evidence | **NOT RUN** |

**Release gate:** A complete hosted PASS requires independent signed wallet actions and publicly verified transaction hashes with matching balances, a correctly restored pending intent, and explicit reviewer approval. Anything else is a partial prototype exercise, not a production or mainnet security claim.
