# AccordBridge prototype blueprint — draft 0.1

Status: target design, partially implemented as a local sample-data prototype. See the [README](../README.md) for implemented flows and remaining gaps. This document expands [SCREENS.md](SCREENS.md). Product rules remain governed by the [backend specification](https://github.com/accordbridge-labs/accordbridge-backend/blob/main/docs/PRODUCT.md); illustrative policy values below do not settle open business decisions.

## Purpose and prototype boundary

Demonstrate how a freelancer and an existing client move from a clear agreement to a funded milestone, submitted work, and settlement. The prototype will use synthetic accounts, documents, and balances, with a persistent “Demo — sample data, no real payments” notice. It will not connect wallets, collect credentials, upload customer files, or submit blockchain transactions.

Provide a separate demo control for switching between client and freelancer and selecting scenarios. Production users do not gain another participant's permissions by switching views.

## Example project

Client: Maya, owner of a fictional business called Northstar Studio. Freelancer: Tobi, a fictional web developer. Project: a five-page business website.

| Milestone | Gross amount | Acceptance criteria |
| --- | --- | --- |
| Design | 150 USDC | Five agreed page layouts; desktop and mobile designs; named page sections present |
| Development | 300 USDC | Implement approved designs; working contact form; agreed browser and mobile checks |
| Handover | 150 USDC | Source files, deployment instructions, and an agreed walkthrough |

Base project total: 600 USDC. Use two in-scope revision rounds as an illustrative agreement setting. Use a proposed seven-calendar-day review window followed by escalation, not automatic payment. Populate actual sample dates with an explicit timezone when producing the prototype.

Use a visibly marked illustrative fee setting of 0.3% provider fee and 0% platform fee for the normal payout example: 150 USDC gross, 0.45 USDC provider fee, 149.55 USDC net. This is not AccordBridge pricing, a network-fee estimate, or verification of a deployed contract. A real funding screen must show a confirmed fee breakdown or block signing when it cannot obtain one.

## Navigation and visual direction

Desktop navigation: Overview, Projects, Wallet, Resolution centre. Account and help controls sit separately. Projects are primary; wallet details support the work flow.

Use a light neutral background, dark navy text, and restrained teal actions. Reserve amber for attention, red for errors, and text-plus-icon badges for status. Do not communicate state through colour alone. Keep one clear primary action per screen section.

On mobile, present the next-action card before financial summaries and milestone details. Tables become labelled cards. Confirmation controls remain reachable without obscuring amounts or terms. Dialogs need focus management, visible focus, and keyboard dismissal where safe.

## Screen 1: Dashboard

Purpose: show what requires attention and which work is funded.

Content order:
1. Page title and “Create agreement” action.
2. “Needs your attention” cards ordered by urgency.
3. Separate summaries for funds available in the connected wallet, funds locked in escrows, and disputed funds. Disputed funds are a subset of locked funds, not an extra amount to add.
4. Project list with counterparty, milestone, funding state, next actor, and deadline.

| Context | Main card | Primary action |
| --- | --- | --- |
| Freelancer, agreement awaiting client | “Maya is reviewing agreement v1” | View agreement |
| Client, agreement accepted but unfunded | “Fund the design milestone: 150 USDC” | Review funding |
| Freelancer, confirmed first deposit | “Design milestone funded” | Open workspace |
| Client, work submitted | “Review design submission v1” | Review work |
| Either party, disputed milestone | “Design milestone under review” | View case |

For the example, display total project value 600 USDC, confirmed milestone funding 150 USDC, and future unfunded work 450 USDC. Do not describe 600 USDC as secured.

Empty state: explain creating a first agreement, with a single action. Loading and unavailable states must not display fabricated zero balances. Stale financial data shows the last checked time and an explicit warning.

## Screen 2: Create agreement

Steps: project and counterparty → deliverables and milestones → review/revision terms → fees and resolution terms → preview and send.

Each milestone includes scope, exclusions, acceptance checklist, gross price, delivery date/timezone, and included revisions. The preview lists client, freelancer, asset/network, resolver arrangement, cancellation policy, fee allocation, and proposed review window.

“Save draft” preserves incomplete work. “Send for review” requires complete fields and creates a specific proposal version. Missing policy decisions must be labelled placeholders in the prototype; a live agreement cannot accept unresolved required terms.

## Screen 3: Client agreement review

Show a plain-language summary above the full milestone table. Actions: “Accept agreement” and “Propose changes”. Display which version each party accepted.

A change creates v2 and requires fresh acceptance from both parties. Show what changed in scope, amount, dates, fees, and resolver terms. Never silently carry acceptance from an older version. Funding remains unavailable until the same version is mutually accepted.

Do not promise an invitation is anonymous access to private evidence. An invitation must eventually require the intended party's authenticated acceptance; account mechanics are a later interface decision.

## Screen 4: Funding confirmation

Show the selected milestone, confirmed agreement version, Stellar network, exact asset identity, gross amount, fees, expected net recipient amount, destination escrow and signing wallet. The full destination is available for inspection. “Fund design milestone” is the primary action only when prerequisites are satisfied.

Demo transitions: awaiting signature → submitted → confirmed. Alternative branches: cancelled signature, wrong network, failed transaction, unknown outcome. Rejected signing is not a failed on-chain transaction. For an unknown outcome, offer “Check transaction” rather than another funding request.

Success copy: “Design milestone funded: 150 USDC.” Link the receipt and return to the workspace. Do not mark development or handover funded.

## Screen 5: Project workspace

Layout:
- Header: project, counterparty, agreement version, project status.
- Next-action card: responsible party, action, deadline and timezone.
- Milestone list: price, funding state, work/review state, and payment state.
- Selected milestone: accepted scope, acceptance criteria, submissions, feedback, and activity.
- Financial panel: gross, fees, net, and transaction confirmation status.

### Freelancer view

On a funded milestone, “Submit work” opens a form with delivery notes, a sample file/reference, and responses to acceptance criteria. Review the submission before confirming. Submitted versions cannot be overwritten; corrections create a new version. The initial prototype uses predefined sample evidence only.

On an unfunded milestone, show “Awaiting funding” and allow reviewing scope. Do not present work as protected simply because an agreement exists.

### Client view

“Review submission” opens the specific submitted version next to its acceptance checklist. Provide three actions: “Approve milestone”, “Request revision”, and “Open dispute”.

Approval confirmation shows the amount and explains that approval authorizes the payout process. Preserve “Approved — payment pending” until the required financial action is confirmed; do not collapse approval and settlement if the chosen contracts separate them.

A revision request selects unmet criteria and captures actionable feedback. Requests outside the scope can become a change proposal. Disagreement about whether a request is in scope can escalate; the software does not automatically judge quality.

## Screen 6: Funded change request

Example: add an online store for 200 USDC and extend the affected schedule by three days. Show the original 600 USDC agreement and the proposed 800 USDC total side by side. The base work remains unchanged until the change is accepted.

States: proposed → accepted by both → awaiting funding → confirmed funding → active. Rejected proposals retain their history. Acceptance alone does not mark additional work funded. The change cannot spend funds allocated to existing milestones.

## Screen 7: Resolution centre

Show the disputed milestone, gross funds held, agreed terms, submission versions, each party's statement, reviewer assignment, next step, and response deadline. Restrict evidence access to authorized case participants.

Client-silence copy: “The review period has ended. Request a reviewer decision.” Do not promise immediate or automatic release.

Cancellation has two paths: both parties agree on settlement; or a contested request proceeds to review. A database agreement is not itself a completed refund. Show settlement proposed, authorized, submitted, and confirmed as distinct states.

The decision view displays a reason and an itemized split with gross allocations, fee deductions, and net receipts. Label any appeal arrangement as an unresolved policy until agreed; never imply settled chain payments can be reversed by a UI action.

## Screen 8: Wallet and receipts

Show available wallet funds separately from each escrow's balance. Within project summaries show funded, unfunded, released, refunded, and disputed amounts without double counting. A receipt identifies project/milestone, network, asset, parties, gross amount, deductions, net recipients, timestamp and transaction reference.

For the prototype, transaction references must be visibly synthetic and must not link to invented explorer records. Export content should be described as a payment record, not a certified tax document.

## Review checklist

- A user can identify the funded milestone, next actor, deadline, and expected payout.
- Changing scope requires both parties' acceptance and extra funding where applicable.
- Every submission/review refers to the right agreement and delivery version.
- Disputed balances are not double-counted or shown as available.
- Pending or unknown transactions are never displayed as settled.
- Silence, revisions and cancellation have explicit paths and no unsupported payment guarantee.
- Sensitive evidence is not presented as public blockchain data.
- Keyboard/mobile navigation and readable statuses are included.
- The six scenarios in SCREENS.md can be followed from start to settlement or an explicitly pending decision.

## Implemented scenario coverage

The six core scenario paths are now available in `/demo`: normal completion,
revision, separately funded extra work, deadline escalation, disputed work and
cancellation/split settlement. See [the walkthrough and verification boundary](DEMO-SCENARIOS.md).
This remains a target design, not a claim that every screen detail or optional
wallet failure branch above has shipped. The synthetic split requires both
participants' authorization; it does not decide real reviewer powers or appeal
rules. Extra work ends at confirmed funding/active work, and later base milestones
remain unfunded. No provider selection or production deployment is authorized.
