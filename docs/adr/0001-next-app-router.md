# ADR-0001: Next.js App Router as Application Shell

Status: RETROSPECTIVE ADR Date: UNKNOWN Confidence: HIGH that this is current
architecture; LOW about original intent Owner: UNKNOWN Supersedes: UNKNOWN
Superseded by: None identified

## Context

Routes live under `src/app`, root metadata/layout are App Router constructs, and
API handlers use `src/app/api/**/route.ts`. Package declares Next.js 16 and
React 19.

## Decision (Observed)

The application currently uses the Next.js App Router with a shared root server
layout and client `AppClientLayout` for authentication, navigation and
interactive state.

## Alternatives

UNKNOWN historically. Pages Router, separate SPA/API service, and server-only
rendering are conceivable alternatives, not known prior proposals.

## Rationale / Tradeoffs

The current structure enables file-system routes, server actions, route
handlers, metadata, loading/error boundaries, and shared layouts. It also
couples runtime conventions to Next/Vercel and requires careful division between
server and client components. Original rationale is UNKNOWN.

## Evidence

- `package.json`
- `src/app/layout.tsx`
- `src/components/AppClientLayout.tsx`
- `src/app/api/**/route.ts`
- `vercel.json`
