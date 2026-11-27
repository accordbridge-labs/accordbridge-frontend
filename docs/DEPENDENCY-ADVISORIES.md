# Dependency advisories: scope and triage

This repository runs a separate [dependency advisory workflow](../.github/workflows/dependency-advisories.yml)
that reads `package-lock.json` only. It does not install application scripts,
start a dev server, contact Stellar RPC, use Freighter, or deploy anything. It
has `contents: read` only and no secrets, including on untrusted pull requests.

## What the check does

1. Pins the scanner (`npm@10.9.9`) and installs the lockfile with `--ignore-scripts`.
2. Runs `npm audit --json`, then classifies the result with
   `scripts/check-audit-json.mjs` rather than relying on the command exit code.

Outcomes:

| Outcome | Meaning | CI result |
| --- | --- | --- |
| `PASS` | No critical/high advisories; moderate/low are printed, not waived | Success |
| Critical or high advisory | A direct or transitive dependency needs a patch or a documented exception | Failure |
| `ADVISORY DATABASE UNAVAILABLE` | Registry/advisory-network failure or unreadable output — **not** a clean scan | Failure (infrastructure) |

A scheduled run (weekly) catches advisories published after a PR was merged.
A clean scan is **not** a security audit, an endorsement of dependency
maintenance, or a mainnet-readiness claim.

## Triage rules

1. Reproduce locally with `npm ci && npm audit --json`; record the npm version,
   advisory IDs, affected versions, and whether the dependency is direct.
2. Prefer a compatible patched upgrade. Update `package.json` and the lockfile
   together, then run `npm test`, `npm run build`, `npm run typecheck` and
   `npm run test:e2e` before opening the change.
3. If no patch exists, open a GitHub issue with the advisory ID, affected code
   path, actual exposure in this testnet prototype, and the proposed follow-up.
   Do not add a silent ignore.
4. Time-bounded exceptions must name the advisory, the reason, the reviewer,
   and an expiry date; they belong in an issue and a linked PR description,
   never in an untracked local config.
5. Moderate/low findings are reported for review. Repeated findings without a
   plan are not acceptable simply because CI stays green.

See the [organization contribution terms](https://github.com/accordbridge-labs/.github/blob/main/CONTRIBUTING.md)
for the rule that a mocked or advisory-only check must not be presented as a
live-wallet or audit result.
