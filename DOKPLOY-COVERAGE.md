# Dokploy adoption coverage

Official repository: https://github.com/Dokploy/dokploy
Pinned reference: 53464e9096a0976e8e4a8f3a1908bc1054e45a37

## Attribution
Dokploy Technology, Inc., copyright 2026-present. Apache-2.0 applies outside proprietary directories. See licenses/DOKPLOY-LICENSE.md. Dashboard neutral theme values were adapted from apps/dokploy/styles/globals.css; Aetheris routing and server calls are independently adapted for TanStack Start. No proprietary files were copied. No upstream NOTICE file was found at the pinned repository root.

## Implemented in Aetheris
- Neutral light/dark/system dashboard theme; stored preference, theme-aware portal overlays.
- Full infrastructure/settings navigation registry and searchable page navigation.
- Existing IA/workspace/marketplace/models/storage/API keys/account presentation adapted.
- Server-only, AES-GCM encrypted, caller-scoped Dokploy connection configuration; verifies project.all before saving.
- Project listing/search/create and environment listing using real Dokploy responses, not seeded entries.
- Disconnected infrastructure states; no fake engine creation/status/metrics or model deployment success.

## Dependency-blocked: real instance required
The following screens currently present connection status and, when connected, an explicit link to the matching screen in the user's own Dokploy instance. These are NOT fully ported, embedded, or end-to-end verified Aetheris features:
- Overview, monitoring, deployments, schedules, Traefik, Docker, Swarm, networks, requests.
- Web server, remote servers, deployment settings, users, SSH keys, AI, tags, Git providers, registries, logs/metrics, secrets, DNS providers/zones, S3 destinations, certificates, notifications, Dokploy sessions.
- Per-service application/Compose/database pages, build providers, environment variables, domains, logs, monitoring, volumes, resource limits, backups, terminal and templates need an accessible Dokploy instance and version/permission verification before safe integration.
- Project creation/listing, container operations and ownership isolation are not verified against an external instance because no endpoint or credential has been supplied.
- GitHub/Colab direct repository notebook opening and actual GPU training remain unverified; existing local notebook generation is preserved.

## Licensed exclusions
Audit logs, SSO/SCIM, custom roles, whitelabeling and Enterprise license management: not copied/activated. Dokploy Cloud billing/invoices and advanced Cloud monitoring: not implemented. No Cloud-exclusive functionality is promised under the OSS license.

## Existing service limitations
Aetheris engine actions return 503 while no real container provider is bound. Model reference imports are metadata registration, not file downloads or hosting. Payments remain disabled. Storage usage requires actual provider read; 1 Go index allocation display does not establish a working index upload/quota enforcement flow.
