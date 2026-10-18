# Hosted preflight

The [18 October 2026 result](evidence/hosted-preflight-2026-10-18.json) records
seven passing checks against the stable public workspace: basic health, protected
endpoint access, cross-origin rejection, Chromium sign-in rendering, session cookie
properties, separate accounts, agreement persistence and authenticated Testnet readiness.
The result groups related assertions into seven checks.

This is a limited HTTP/browser preflight. It does **not** complete the
[manual two-profile Freighter acceptance procedure](HOSTED-ACCEPTANCE.md).
No wallets were connected, signatures requested, tokens minted or funds moved.
The frontend commit has a successful Vercel deployment status; the API does not
expose its deployed commit, so exact backend deployment provenance remains unverified.

## Reproduce deliberately

Install repository dependencies and Chromium as described in the README. Run:

```sh
node scripts/hosted-preflight.mjs
```

The default performs only health/access checks, an invalid-origin login request
with no credentials, and public page rendering. It creates no accounts or projects.
To test hosted persistence as well:

```sh
node scripts/hosted-preflight.mjs --create-fixtures
```

That flag creates **two synthetic accounts and one unfunded project on the hosted
database**. There is currently no account/project deletion API, so these fixtures
remain. Use sparingly; this is not a recurring production-monitoring task. The
18 October run left exactly those fixtures and requested logout for both accounts. No
passwords, cookies, signing payloads or identifying customer data are stored in
the evidence. Credentials are random and held in memory only.

The script intentionally uses the stable published origin and does not accept an
arbitrary target. It fails on unexpected status or state and never retries a write.
After an interrupted write, inspect saved state before deciding to run again;
rerunning with the flag creates new fixtures. Output is sanitized JSON, not a
network trace. Do not add cookie-bearing traces to the evidence directory.

Network failures or cold starts can fail a preflight. Report failures as observed;
do not relabel them as passes based on a later local or mocked check. Readiness is
a short-lived deployment observation, not proof of payment or a security audit.
