# Dependency Inventory

Status: Package-manifest inventory; no vulnerability scan performed Source:
`package.json`, `package-lock.json` Last Verified: 2026-10-05 Confidence: HIGH
for declared package/range; exact deployed resolution may differ by
lockfile/runtime Owner: UNKNOWN Related Documents:
[Machine dependency inventory](inventory/dependency-inventory.json),
[DevOps guide](DEVOPS_GUIDE.md)

Runtime dependencies: Next.js, React/React DOM, Neon serverless PostgreSQL,
Vercel Blob, Upstash REST via internal fetch client, AG Charts, Recharts, React
Icons, and `to-words`.

Development dependencies: ESLint 9 and React plugins, TypeScript 6 and typings,
Sass, Prettier, Storybook 10 with Next integration/docs, globals, TypeScript
ESLint.

Exact package ranges are in `package.json` and duplicated in
`inventory/dependency-inventory.json`. The lockfile is `package-lock.json`. No
production/development dependency audit, license audit, SBOM or scheduled
vulnerability scan was found or run. No alternatives or upgrades are recommended
by this inventory.
