# Six prototype journeys

Open `/demo` locally or on the deployed frontend. Every balance, participant,
deadline and transaction reference on this route is synthetic. No API mutation,
wallet connection or blockchain submission occurs. Refresh or **Reset** clears
all state; use fictional information only. The persistent `/` workspace is separate.

The role selector is a demo control, not production access control. Buttons named
**simulate confirmation** and **advance demo clock** are test controls, not actions
a real participant could use to assert a payment or change the time.

| Journey | Steps | Expected result |
| --- | --- | --- |
| Normal completion | **01 Agreement** → accept as both roles → fund as Maya → simulate confirmation → submit as Tobi → approve as Maya → confirm approval → simulate payment confirmation → view receipt. | Only the first milestone settles; the 150.00 gross example shows 0.45 illustrative fee and 149.55 net. |
| In-scope revision | **03 Client review** → enter criterion-specific feedback as Maya → request revision → switch to Tobi and resubmit → review/approve as Maya. | Versions remain visible, the review window restarts and revision rounds cannot exceed the agreement setting. |
| Funded extra work | **04 Extra work** → propose online store → accept separately as both roles → fund as Maya → optionally simulate unknown deposit → check/confirm. | Accepted scope is not counted as held until confirmation; 200.00 is held separately from the base milestone. Reject instead to preserve a rejected proposal without changing base scope or balances. |
| Client silence | **05 Client silence** → advance the demo clock through the seven-day sample window → request review as Tobi. | No automatic release. The first milestone remains held and enters review/dispute. All dates are explicit UTC. |
| Disputed work and split | **07 Split settlement** → inspect submission evidence → enter a fictional decision reason and allocation → propose → accept as both participants → submit as Maya → check/confirm. | Itemized freelancer gross/fee/net and client refund. A 75.55 gross allocation yields 0.23 fee, 75.32 net and 74.45 refund. This is mutually authorized design exploration, not unilateral reviewer authority. |
| Cancellation | **06 Cancellation** → propose zero freelancer allocation with a reason → accept as both roles → submit → confirm. Alternatively contest the proposal and explore a split. | A full first-milestone refund or an explicitly pending contested case. Authorization alone does not refund; uncertain submission blocks resubmission. |

## Money and scope boundaries

- Base example total: 600.00 sample USDC. Base first milestone: 150.00. Later base
  milestones: 450.00 unfunded. A proposed/rejected change is not included in the
  accepted total; mutual acceptance adds 200.00 unfunded, and confirmation moves
  those 200.00 into a separate held allocation.
- Base gross allocations conserve cents: freelancer gross plus client refund equals
  the first-milestone deposit. Gross released includes the illustrative fee; the
  receipt shows net separately. Refunded money is not reclassified as unfunded work.
- The illustrative +3-day extension applies to added work after its deposit is
  confirmed. Original agreement deadlines and base escrow terms are not rewritten.
- First-milestone cancellation/split does not cancel or settle a separately funded
  change. That deposit remains visibly held. Extra-work delivery/settlement and
  progression through later base milestones are outside this slice.
- A contested proposal retains its amount/reason in activity and returns to review.
  Terminal confirmation is idempotent; there is no UI reversal of a confirmed record.
- Fees are illustrative: 0.3% of freelancer gross rounded to cents; refund/platform
  fees zero; network fees unestimated. Actual financial policy remains unresolved.

## Verification

`npm test` covers transition guards, wrong-role actions, stale/duplicate operations,
revision limits, deadline boundaries, invalid splits, conservation and separate
change funding. `npm run test:e2e` runs existing and added flows on desktop and
mobile Chromium, including keyboard form submission, readable validation, unknown
outcomes, receipts, responsive width and reset-on-refresh. The cancellation browser
test also asserts that the demo makes no HTTP mutation requests.

These checks exercise local synthetic behavior, not manual assistive-technology
certification, Freighter extension acceptance, live-chain settlement or an audit.
