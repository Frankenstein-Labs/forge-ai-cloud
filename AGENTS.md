# Architecture rules

- Keep TanStack Start routing and Aetheris authentication; adapt Dokploy OSS patterns rather than introducing Next.js, because the deployed hosting runtime is fixed.
- Scope Dokploy theme tokens to the connected dashboard shell, because the public site is outside the dashboard redesign.
- Target independent infrastructure providers behind authenticated server functions; retain the existing external Dokploy connector only as a transitional option, never simulate container operations or share administrative credentials.
- Keep pinned Apache-licensed upstream UI sources in vendor/dokploy outside the application compilation graph; adapt executable screens under src with Aetheris data and routing, because upstream Next.js/tRPC and proprietary imports cannot run unchanged here.
- Use a shared Dokploy screen registry to track navigation, official source references and integration prerequisites, so unavailable infrastructure is never represented as working.
- Google OAuth returns to the public auth page with a sanitized internal destination; navigate only after the session is hydrated, to avoid protected-callback redirect loops.