# Architecture rules

- Keep TanStack Start routing and Aetheris authentication; adapt Dokploy OSS patterns rather than introducing Next.js, because the deployed hosting runtime is fixed.
- Scope Dokploy theme tokens to the connected dashboard shell, because the public site is outside the dashboard redesign.
- Keep Dokploy infrastructure on an external instance and access it through authenticated server functions; never simulate container operations or share administrative credentials with app users.
- Use a shared Dokploy screen registry to track navigation, official source references and integration prerequisites, so unavailable infrastructure is never represented as working.
- Google OAuth returns to the public auth page with a sanitized internal destination; navigate only after the session is hydrated, to avoid protected-callback redirect loops.