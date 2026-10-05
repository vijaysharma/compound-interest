# Definition of Done

Status: Recommended completion checklist; not a verified team policy Source:
Repository architecture, financial/security risks and test conventions Last
Verified: 2026-10-05 Confidence: HIGH Owner: UNKNOWN Related Documents:
[Change management](CHANGE_MANAGEMENT.md), [testing and QA](TESTING_AND_QA.md)

## Production Change Checklist

- [ ] Requirement, affected routes/actions/data and expected behavior are
      documented.
- [ ] Types and runtime input validation are updated consistently.
- [ ] Focused tests cover normal, boundary, invalid, failure, and regression
      cases.
- [ ] `npm test`, lint, and build run as applicable; failures/unrun checks are
      reported.
- [ ] Financial results are independently verified; legal/tax rules have
      appropriate review.
- [ ] Data source, units, effective date, freshness, transformations and
      fallback are documented.
- [ ] Authz, secret handling, PII, logs, external processors and abuse limits
      are reviewed.
- [ ] AI prompt/data/output/cost/safety docs are updated when AI is involved.
- [ ] Keyboard, screen-reader semantics, contrast/reduced-motion and mobile
      layouts are checked when UI changes.
- [ ] Database migration is forward-safe, rehearsed on a copy, backed up and has
      a rollback/recovery plan.
- [ ] API, route, env, schema, requirements and machine inventories are current.
- [ ] ADR/EDR records are added when a significant architectural/engineering
      decision changes.
- [ ] Monitoring and operator instructions identify failure detection/recovery.
- [ ] Release owner and reviewer are assigned; no secrets or sensitive data are
      committed.

Not every checkbox applies to every change; mark N/A with a reason.
