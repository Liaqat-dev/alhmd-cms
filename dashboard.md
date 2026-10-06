# Admin Dashboard — plan

Notes on what the admin dashboard should show and why. Nothing here is built
yet; the current dashboard is still the four inventory cards.

## What's wrong with the current one

- **Total Students / Total Teachers / Total Classes** are inventory counts that
  barely change month to month. Nobody opens a dashboard to learn the school
  still has 2 classes.
- **Today's Attendance** is actively misleading. It reads straight off
  `Attendance` rows for today, so a morning where nobody has marked anything
  shows `0 present / 0 absent` — indistinguishable from a holiday.
- Nothing on the page tells an admin what needs doing today.

## Row 1 — this month's money

For a fee-collecting institution this is the dashboard. Everything needed is
already on `Challan` (`month`, `year`, `status`, `totalAmount`, `paidAmount`,
`dueDate`).

| Widget | Query |
|---|---|
| **Collected vs expected** | `sum(paidAmount)` over `sum(totalAmount)` for the current month, with a progress bar |
| **Outstanding** | `sum(totalAmount - paidAmount)` where status is UNPAID or PARTIAL |
| **Overdue** | count + amount where `dueDate < today` and status is not PAID — the actionable number |
| **Salaries due** | unpaid `Salary` rows for the month; money going out |

### Caveat: expected only counts generated challans

"Expected this month" is the sum over challans that were actually generated. If
nobody has generated September's challans yet, the widget reads `Rs 0 of Rs 0`
and looks like a catastrophic collection failure.

It has to detect that case and say **"Challans not generated for September"**
with a link to generate them — which is a useful prompt in its own right.

## Row 2 — today's actions

- **"3 of 5 classes marked today"**, listing the unmarked classes, each linking
  to `/mark-attendance/:classId`. Distinct `classId`s in `Attendance` for today
  against the `Class` count. This replaces the misleading attendance card with
  something that tells you whether the data you are looking at is even complete.
  If only one widget gets built, make it this one.
- **Teacher attendance marked today?** — one line, yes/no, from
  `TeacherAttendance`.

## Row 3 — attention lists

Short and clickable: five rows each, not tables.

- **Top defaulters** by outstanding amount, linking to the challan.
- **At-risk attendance** (<75% this month). The register already computes this
  per student.
- **Recent payments** — who paid, how much, when, from `PaymentHistory`. Gives
  the page a live pulse.

## Demote or cut

- **Total Teachers / Total Classes** — a one-line footnote, not cards.
- **Class distribution bars** — keep, but below the fold. Reference data, not a
  daily need.
- **Recent Students** — keep, reframed as "New admissions this month" with the
  issued roll numbers.

## Effort

One new endpoint, or an extension of `getAdminStats` in
`backend/src/controllers/dashboardController.js`. All the queries are
straightforward aggregates over existing columns, and `Challan` is already
indexed on `status` and `dueDate`. No schema changes.

Row 1 plus the "classes not yet marked" widget is where nearly all the value
sits; the rest can follow.
