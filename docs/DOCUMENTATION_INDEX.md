# Documentation Index

Status: Current-state baseline complete; live configuration and legal/provider
verification remain open. Source: Repository implementation, configuration,
schema, tests, and existing documentation Last Verified: 2026-10-05 Confidence:
HIGH for inventory scope; subsystem details remain subject to each document's
evidence notes Owner: UNKNOWN Related Documents:
[Existing Shiprocket technical note](shiprocket-admin-technical-doc.md)

This index organizes the repository's current-state documentation.
Implementation is authoritative. Existing prose is retained as historical input
until reconciled; it is not treated as verified merely because it exists.
Unknowns and recommendations are labeled explicitly.

## Evidence Labels

- **VERIFIED**: directly supported by current executable source, schema,
  configuration, or tests.
- **PARTIALLY VERIFIED**: some behavior is evidenced, but one or more
  runtime/provider/environment details are not.
- **UNKNOWN**: not established from available repository evidence.
- **NOT IMPLEMENTED**: no implementation was found in the inspected scope; this
  is not a claim about external systems.
- **REQUIRES HUMAN CONFIRMATION**: depends on production configuration, provider
  account state, legal interpretation, or operator knowledge unavailable in the
  repository.
- **DOCUMENTATION GAP**: a needed explanation or evidence trail is absent or
  stale.
- **TECHNICAL RISK**: implementation or operational condition that may affect
  security, integrity, availability, or maintainability.
- **POTENTIAL DEFECT**: evidence suggests a concrete incorrect or fragile
  behavior; no production code is changed by this audit.

## 00 — Overview and Handover

- [Project master map](PROJECT_MASTER_MAP.md)
- [Current system status](CURRENT_SYSTEM_STATUS.md)
- [Documentation vs implementation drift](DOCUMENTATION_VS_IMPLEMENTATION_DRIFT.md)
- [Documentation gap analysis](DOCUMENTATION_GAP_ANALYSIS.md)
- [Documentation consistency report](DOCUMENTATION_CONSISTENCY_REPORT.md)
- [Documentation certification](DOCUMENTATION_CERTIFICATION.md)
- [Developer guide](DEVELOPER_GUIDE.md)
- [Handover guide](HANDOVER_GUIDE.md)
- [AI-agent onboarding](AI_AGENT_ONBOARDING.md)
- [Team onboarding](TEAM_ONBOARDING_GUIDE.md)

## 01 — Product and Requirements

- [Product and feature inventory](PRODUCT_AND_FEATURE_INVENTORY.md)
- [Functional requirements](FUNCTIONAL_REQUIREMENTS.md)
- [Non-functional requirements](NON_FUNCTIONAL_REQUIREMENTS.md)
- [Business rules](BUSINESS_RULES.md)
- [User journeys](USER_JOURNEYS.md)
- [Traceability matrix](TRACEABILITY_MATRIX.md)

## 02 — Architecture and Decisions

- [System design](SYSTEM_DESIGN.md)
- [Architecture decision records](adr/README.md)
- [Engineering decision records index](EDR_INDEX.md)
- [Dependency inventory](DEPENDENCY_INVENTORY.md)

## 03 — Financial Domain

- [Financial calculation catalog](FINANCIAL_CALCULATION_CATALOG.md)
- [Financial calculation audit](FINANCIAL_CALCULATION_AUDIT.md)
- [Financial test matrix](FINANCIAL_TEST_MATRIX.md)

## 04 — Data, API, and Database

- [Data sources and provenance](DATA_SOURCES_AND_PROVENANCE.md)
- [Data freshness](DATA_FRESHNESS.md)
- [API catalog](API_CATALOG.md)
- [Server actions inventory](SERVER_ACTIONS_INVENTORY.md)
- [Database architecture](DATABASE_ARCHITECTURE.md)
- [Database data dictionary](DATABASE_DATA_DICTIONARY.md)
- [Database ERD](DATABASE_ERD.md)
- [Environment variables](ENVIRONMENT_VARIABLES.md)

## 05 — AI, Security, and Privacy

- [AI architecture](AI_ARCHITECTURE.md)
- [AI safety and governance](AI_SAFETY_AND_GOVERNANCE.md)
- [Authentication and authorization](AUTH_SECURITY.md)
- [Security architecture](SECURITY_ARCHITECTURE.md)
- [Security findings](SECURITY_FINDINGS.md)
- [Data privacy and governance](DATA_PRIVACY_AND_GOVERNANCE.md)

## 06 — UX and Quality

- [Design system](DESIGN_SYSTEM.md)
- [Mobile-first design guide](MOBILE_FIRST_DESIGN_GUIDE.md)
- [Accessibility guide](ACCESSIBILITY_GUIDE.md)
- [Accessibility audit](ACCESSIBILITY_AUDIT.md)
- [Testing and QA](TESTING_AND_QA.md)
- [Test execution record](TEST_EXECUTION_RECORD.md)
- [Performance architecture](PERFORMANCE_ARCHITECTURE.md)
- [Performance findings](PERFORMANCE_FINDINGS.md)
- [SEO guide](SEO_GUIDE.md)

## 07 — Operations and Governance

- [Admin operations guide](ADMIN_OPERATIONS_GUIDE.md)
- [Games architecture](GAMES_ARCHITECTURE.md)
- [DevOps guide](DEVOPS_GUIDE.md)
- [Deployment guide](DEPLOYMENT_GUIDE.md)
- [Operations runbook](OPERATIONS_RUNBOOK.md)
- [Observability guide](OBSERVABILITY_GUIDE.md)
- [Disaster recovery](DISASTER_RECOVERY.md)
- [Business continuity](BUSINESS_CONTINUITY.md)
- [Risk register](RISK_REGISTER.md)
- [Technical debt register](TECHNICAL_DEBT_REGISTER.md)
- [Change management](CHANGE_MANAGEMENT.md)
- [Definition of done](DEFINITION_OF_DONE.md)
- [Documentation governance](DOCUMENTATION_GOVERNANCE.md)

## 08 — Machine-Readable Inventories

- [System inventory](inventory/system-inventory.json)

- [Route inventory](inventory/route-inventory.json)
- [API inventory](inventory/api-inventory.json)
- [Database inventory](inventory/database-inventory.json)
- [Dependency inventory](inventory/dependency-inventory.json)
- [Environment inventory](inventory/environment-inventory.json)
- [Financial calculation inventory](inventory/financial-calculation-inventory.json)
- [Data-source inventory](inventory/data-source-inventory.json)
- [AI-system inventory](inventory/ai-system-inventory.json)
- [Risk inventory](inventory/risk-inventory.json)
- [Technical-debt inventory](inventory/technical-debt-inventory.json)
- [Documentation inventory](inventory/documentation-inventory.json)

## Source-of-Truth Rules

1. Current executable source and tests define behavior; schema and migrations
   define persisted structure.
2. Configuration defines declared deployment behavior, not proof of a live
   deployment.
3. Existing docs and comments are historical evidence and must be reconciled
   against implementation.
4. No secret values are included in this documentation set. Secret-like values
   found in ignored local material are not copied; their validity and rotation
   status require secure human review.
5. Recommendations are not represented as implemented controls or approved
   requirements.

## Legacy Inputs

- [Shiprocket technical note](shiprocket-admin-technical-doc.md) is retained as
  historical operator documentation. Provider-specific claims have not been
  independently live-verified; consult the drift register before relying on
  them.
- `README.md`, `APIS_AND_ACTIONS.md`, and `PERFORMANCE_AND_SECURITY_REPORT.md`
  remain at the repository root. Their current-state claims are reconciled only
  where recorded in `DOCUMENTATION_VS_IMPLEMENTATION_DRIFT.md`.
