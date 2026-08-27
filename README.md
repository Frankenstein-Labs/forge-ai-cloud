# Aetheris Cloud

Aetheris Cloud is a SaaS control plane for AI providers. It provides identity, API keys,
usage visibility and a unified OpenAI-compatible gateway; inference and compute remain with
external providers. Aetheris does not claim to own GPUs or create a runtime when no provider is
configured.

## Current status

The project is in a hardening migration. Supabase authentication, user profiles, API-key hashing
and an OpenAI-compatible chat route exist. Hugging Face and the temporary Lovable gateway are
only available when their server credentials are configured. Stripe, external runtime provisioning,
MCP governance, organization RBAC, payment flows and partner payouts are **not yet enabled**.

The dashboard surfaces unavailable integrations as configuration-dependent. Do not use the legacy
engine metrics, seeded marketplace statistics, local invoice screens, or deployment records as
production infrastructure evidence.

## Architecture

```text
Web client / SDK
       |
       v
Aetheris API gateway -- auth, API-key permissions, request IDs, quotas
       |
       +-- Hugging Face Inference Providers (when HF_TOKEN is set)
       +-- temporary Lovable AI gateway (when LOVABLE_API_KEY is set)
       |
       v
Supabase control plane -- profiles, keys, usage records, RLS
```

## Prerequisites

- Node.js 22+ and npm.
- A Supabase project for authentication and database migrations.
- Optional provider credentials for inference.

## Install and run

```bash
cp .env.example .env
npm ci
npm run dev
```

Apply the SQL files in `supabase/migrations/` to the target Supabase project in chronological
order. Never apply a migration to production without backup and review.

## Configuration

Copy `.env.example`; it documents every supported environment variable. `VITE_*` variables are
the only values intended for the browser. Provider tokens, Stripe credentials, storage credentials,
Mongo proxy tokens and Supabase service-role keys are server-only and must never be committed or
stored in browser storage.

`ALLOWED_ORIGINS` is a comma-separated allowlist for browser API origins. Keep it empty for
same-origin-only deployments; add explicit HTTPS origins in staging and production.

## API

The existing OpenAI-compatible endpoint is:

```bash
curl "$AETHERIS_BASE_URL/api/v1/chat/completions" \
  -H "Authorization: Bearer $AETHERIS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"hf/mistralai/Mistral-7B-Instruct-v0.3","messages":[{"role":"user","content":"Bonjour"}]}'
```

Keys require `read_write` or `admin` permission for inference. Responses expose an
`X-Request-ID` for support correlation. Requests and provider failures are intentionally
normalized so upstream implementation details and secrets are not exposed.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run check:git
```

## Security and operations

- RLS is enabled for the existing user-owned application tables.
- API keys are stored as SHA-256 hashes and validated by a Supabase RPC.
- Do not store service credentials or provider master keys in local storage.
- Use a restricted `ALLOWED_ORIGINS` value in deployed environments.
- Review database backups, provider contracts, retention requirements and Stripe webhook secrets
  before enabling billing or marketplace payments.

## Known limitations

The initial schema is user-centric. Organization ownership, atomic usage reservation, append-only
economic ledger, Stripe webhook processing, governed MCP, real compute providers, durable uploads
and marketplace payment/payout flows are intentionally not represented as production-ready yet.
Their interfaces and migrations must be completed before enabling those product claims.
