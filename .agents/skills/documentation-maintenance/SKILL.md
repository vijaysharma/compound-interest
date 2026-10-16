---
name: documentation-maintenance
description: >-
  Guide for keeping documentation, architecture logs, and changelogs aligned
  with code changes in Happy Finance. Use when completing features, changing
  contracts, or updating architectural decisions.
---

# Documentation Maintenance Workflow

Use this skill when updating project documentation after code changes.

---

## 1. Documentation Update Trigger Matrix

Update documentation according to the matrix in [`AGENTS.md`](../../AGENTS.md)
§7:

| Change                                      | File to Update                                                     | Instructions                                                        |
| :------------------------------------------ | :----------------------------------------------------------------- | :------------------------------------------------------------------ |
| **Any user-visible change**                 | `CHANGELOG.md`                                                     | Add under `## [Unreleased]` section.                                |
| **System rules / Agent constraints**        | `AGENTS.md`                                                        | Only when project-wide conventions or rules change.                 |
| **Design tokens, UI components**            | `docs/ui/design-system.md`                                         | Keep token names, SCSS mixins, and component rules aligned.         |
| **Env vars, deploy, hosting, regions**      | `docs/architecture/deployment-and-environments.md`, `.env.example` | Document any new variable, default value, or region requirement.    |
| **Operational runbook, scripts, dev setup** | `docs/architecture/operational-runbook.md`, `README.md`            | Update commands and operational procedures.                         |
| **API endpoints / contracts**               | `docs/api/*`                                                       | Update request parameters, headers, or response payloads.           |
| **Architectural decisions**                 | `.local/governance/decisions-log.md`                               | Prepend newest decision at top of file with date, category, status. |
| **Completed task milestone**                | `.local/governance/progress-tracker.md`                            | Prepend newest milestone at top of file.                            |
| **Technical debt discovered / resolved**    | `.local/governance/tech-debt.md`                                   | Update debt inventory.                                              |

---

## 2. Guardrails

- **Zero Duplication**: Do not create redundant summary documents or duplicate
  sources of truth.
- **Factual Claims Only**: Describe what the code actually does today. Mark
  anything unverified as such.
- **Do Not Edit Applied Migrations or Past Audit Reports**: Historical reports
  (`*_REPORT.md`, `*_CERTIFICATION*.md`) document the past and should not be
  rewritten.
- **Keep Documentation Index Current**: If adding a new authoritative doc under
  `docs/`, register it in `docs/README.md`.
