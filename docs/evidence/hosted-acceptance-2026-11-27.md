# Hosted two-participant acceptance — fill-in record (2026-11-27)

**STATUS: NOT RUN.** This is a blank recording sheet for the manual procedure in [HOSTED-ACCEPTANCE.md](../HOSTED-ACCEPTANCE.md). Use the [run kit](HOSTED-RUN-KIT.md) for pinned commits, URLs, button labels and phase order. Do not fill a row as PASS without observing it on the hosted Vercel/Render/Neon environment with two distinct desktop profiles and two Freighter wallets on Stellar Testnet. Never record seeds, keys, cookies, signed XDR or private data.

## Reference values — not observations

These are expected values to compare against during the run. Copy them into the
"Observed value" column **only after** the deployed environment actually shows
them. A snapshot that cannot be proven from the running app stays NOT RECORDED.

| Field | Reference value |
| --- | --- |
| Stable frontend URL | `https://accordbridge-frontend.vercel.app` |
| Frontend `main` commit at kit creation | `3b4d13acc3f72510a77d01b7f206ffa96bdf25a1` |
| Backend `main` commit at kit creation | `6877e09f8bd08f434aafa8f291dac8ed5b9504a7` |
| Contracts `main` commit at kit creation | `ca37993c2afefa4c68da7c9009a7f9c0c862dc99` |
| Escrow WASM hash | `0d17ac8fb6495f2258d1707f72157b25f0fa7a4912a2c1691364b302267f86b9` |
| ABUSD token WASM hash | `47d4cdec1486c27f4826bd49764a09dd5eec1d7a5083be43820bca18905f45a3` |
| ABUSD token contract | `CDUMZP5TPU4GAMUL7MQOPJUO7M3HQ2VS6QXD33L6XA6Q4BH3FIRHL3P4` |
| Network | `Test SDF Network ; September 2015` |

## Evidence header (fill during the run)

| Field | Observed value |
| --- | --- |
| Test status | NOT RECORDED |
| UTC start/end timestamps | NOT RECORDED |
| Frontend URL actually opened | NOT RECORDED |
| Render backend hostname (public only) | NOT RECORDED |
| Frontend tested commit SHA | NOT RECORDED |
| Backend / contracts tested commit SHAs | NOT RECORDED |
| Browser A (version, OS, profile) | NOT RECORDED |
| Browser B (version, OS, profile) | NOT RECORDED |
| Freighter A (version, Testnet, public G-address) | NOT RECORDED |
| Freighter B (version, Testnet, public G-address) | NOT RECORDED |
| Separate application account IDs | NOT RECORDED |
| Project ID / agreement version | NOT RECORDED |
| Escrow / ABUSD contract IDs | NOT RECORDED |
| Recorder / reviewer | NOT RECORDED |

## Per-step observations

Replace each `NOT RUN` with PASS / FAIL / BLOCKED and add a UTC timestamp plus a public transaction hash where applicable. Failed or blocked steps stay failed or blocked.

| ID | UTC observed | Browser/profile + Freighter | Commits (front/back/contracts) | Actually observed | Public Testnet hash | Scrubbed evidence file | Blocker / reviewer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| H01 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | N/A | NOT RECORDED | NOT RECORDED |
| H02 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | N/A | NOT RECORDED | NOT RECORDED |
| H03 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | N/A | NOT RECORDED | NOT RECORDED |
| H04 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | N/A | NOT RECORDED | NOT RECORDED |
| H05 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | N/A – proof not broadcast | NOT RECORDED | NOT RECORDED |
| H06 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | N/A – proof not broadcast | NOT RECORDED | NOT RECORDED |
| H07 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | N/A | NOT RECORDED | NOT RECORDED |
| H08 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | N/A | NOT RECORDED | NOT RECORDED |
| H09 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | Friendbot TX A: NOT RECORDED; B: NOT RECORDED | NOT RECORDED | NOT RECORDED |
| H10 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | N/A | NOT RECORDED | NOT RECORDED |
| H11 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| H12 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| H13 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| H14 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| H15 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| H16 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| H17 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | N/A | NOT RECORDED | NOT RECORDED |
| H18 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | N/A | NOT RECORDED | NOT RECORDED |
| H19 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | N/A | NOT RECORDED | NOT RECORDED |
| H20 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| H21 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| H22 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | N/A | NOT RECORDED | NOT RECORDED |
| H23 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | Existing hash: NOT RECORDED | NOT RECORDED | NOT RECORDED |
| H24 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | Existing hash: NOT RECORDED | NOT RECORDED | NOT RECORDED |
| H25 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| H26 | NOT RECORDED | NOT RECORDED | NOT RECORDED | NOT RUN | N/A | NOT RECORDED | NOT RECORDED |

## Release gate

A complete PASS requires independent signed wallet actions, public transaction hashes with matching balances, a restored pending intent, and explicit reviewer approval. Automated unit, browser and workspace suites do not drive Freighter and remain separate evidence.
