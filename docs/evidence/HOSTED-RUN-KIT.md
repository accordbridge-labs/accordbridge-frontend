# Hosted two-wallet acceptance — run kit

**Status: guide only. H01–H26 remain NOT RUN.** This kit helps a human operator
execute the manual procedure in [HOSTED-ACCEPTANCE.md](../HOSTED-ACCEPTANCE.md)
and fill the [blank 27 November recording sheet](hosted-acceptance-2026-11-27.md).
It is not evidence that any step passed.

## Pinned commits to record

These are `main` at the time this kit was written (27 November 2026). Record the
**actual** deployed commits you observe during the run; do not copy these values
into a result row unless the deployment proves them.

| Component | Commit |
| --- | --- |
| Frontend (`3b4d13acc3f7…`) | `3b4d13acc3f72510a77d01b7f206ffa96bdf25a1` |
| Backend (`6877e09f8bd0…`) | `6877e09f8bd08f434aafa8f291dac8ed5b9504a7` |
| Contracts (`ca37993c2afe…`) | `ca37993c2afefa4c68da7c9009a7f9c0c862dc99` |

The Vercel deployment may expose the frontend commit through its deployment
status; the API does **not** expose its deployed commit. Render hostname is a
public value found in the Vercel `BACKEND_URL` setting or the Render dashboard —
record only the hostname, never the Neon connection string or any secret.

## Stable URLs

- Frontend: https://accordbridge-frontend.vercel.app (use the stable production
  URL, not a Vercel preview URL).
- Backend: public Render origin configured as `BACKEND_URL`; the app proxies
  `/api` to it. Confirm its health read during H01.
- Testnet explorer: use a public Stellar Testnet explorer to verify each hash.

## Prerequisites (do these before H01)

1. **Two desktop browser profiles**, not two tabs — for example Chrome Profile A
   and Profile B, or two different browsers. Each profile gets its own
   AccordBridge application account (distinct registration) and its own
   installed/unlocked Freighter wallet with a distinct public G-address.
2. **Throwaway wallets only.** Use newly generated Freighter accounts on
   **Stellar Testnet** (`Test SDF Network ; September 2015`). Never use a
   mainnet wallet, a real recovery phrase, or a wallet holding value.
3. **Test XLM for fees:** request free test XLM from Friendbot for **both**
   G-addresses (H09). Verify activation in a Testnet explorer, not just the
   request response.
4. **Valueless ABUSD:** the client obtains it in the app with the button
   **"Get 1,000 ABUSD test tokens"** (H15). ABUSD is not USDC or a stablecoin.
5. **Evidence hygiene:** never record passwords, session cookies, access
   tokens, signed XDR, recovery phrases, private keys, `.env` files or
   unredacted headers. Public hashes, contract IDs, G-addresses and scrubbed
   screenshots are acceptable.

## Button map for the current UI

Use these exact labels when following H01–H26:

| UI label | Used for |
| --- | --- |
| `Connect & verify Freighter` | H05, H06 — signs a never-broadcast ownership challenge |
| `Prepare milestone escrow` | H10, H12 — client only, requires both app acceptances |
| `Resume wallet signing` | H10, H11 — resumes a cancelled prepared intent |
| `Approve terms with wallet` | H13, H14 — each participant separately |
| `Get 1,000 ABUSD test tokens` | H15 — faucet transaction, verify balance |
| `Prepare test-token funding` | H16 — client only, requires both on-chain approvals |
| `Sign with Freighter & submit` | Final explicit signature/submit for any prepared action |
| `Check transaction & chain state` | H11, H12, H25 — read-only reconciliation of an existing intent |
| `Approve submitted work before release` / `Review release to freelancer` | H19, H20 — approval is off-chain; release is a separate wallet action |
| `Approve mutual refund` | Out-of-band check: one vote must not pay out or freeze release |
| `Check connection` | H22 — bounded read retry after a safe read failure |
| `Testnet transaction records` (details) | Find the existing intent hash before re-checking |

## Phase order

| Phase | Checks | What to establish |
| --- | --- | --- |
| 0 — setup | H01, H02 | Two distinct profiles/accounts/wallets; independent sessions; sign-out isolation |
| 1 — agreement | H03, H04 | Draft persistence and both participants accepting the same version without token movement |
| 2 — wallets | H05–H09 | Ownership proofs, wrong-network/account rejection, Friendbot activation |
| 3 — escrow | H10–H16 | Cancelled signing, pending intent recovery, deploy, both approvals, faucet balance, funding |
| 4 — delivery and settlement | H17–H21 | Submission/revision/approval, then a separate signed release with verified balances |
| 5 — recovery | H22–H26 | Cold start, interrupted writes, unknown outcome, insufficient ledger history, no false success |

Do not skip a phase: later checks depend on the escrow and balances created earlier.

## Recording each step

For every H row in the [blank sheet](hosted-acceptance-2026-11-27.md), fill:

- **UTC observed** time;
- browser/profile and Freighter version plus the selected Testnet network;
- frontend/backend/contract commit SHAs actually observed;
- **Actually observed**: what happened, not what was expected;
- **Public Testnet hash**: copy the existing hash from Freighter or the
  `Testnet transaction records` details, then verify in a Testnet explorer —
  status, amount and parties must match. Use `N/A – off-chain` where no
  transaction exists;
- scrubbed evidence filename (optional);
- blocker/follow-up and reviewer.

A hash alone is not a PASS. A failed or blocked step stays failed or blocked;
never infer PASS from a passing local fixture, a mocked browser test or a
successful HTTP preflight. Automated tests remain in a separate evidence
section of the sheet.

## Completion gate

The run is complete only when all 26 rows have an observed PASS/FAIL/BLOCKED
value, the evidence header is filled with real commits and wallet/public
account identifiers, release and balances were verified from a fresh chain
snapshot, and a reviewer signed off. Until then
[HOSTED-ACCEPTANCE.md](../HOSTED-ACCEPTANCE.md) and the appeal evidence must
continue to say **NOT RUN**.

When completed, commit the filled sheet in a pull request and link that PR and
its public transaction hashes in the appeal bundle. Do not commit secrets or
raw network traces with the sheet.
