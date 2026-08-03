# Connecteur SeaweedFS (S3) pour Aetheris

Brancher le terminal `/dashboard/workspace` et l'API publique sur **ton VPS Seaweed** via son endpoint S3 (port 8333 par défaut). Les modèles lourds (GGUF, safetensors, datasets) seront stockés sur ton VPS, plus sur Supabase Storage.

## Pré-requis côté VPS (à faire par toi)

1. Lancer Seaweed avec S3 activé et accessible publiquement en HTTPS :
   ```bash
   weed server -dir=/data/seaweed -s3 -s3.port=8333 \
     -s3.config=/etc/seaweed/s3.json &
   ```
   Avec `s3.json` qui définit un user `aetheris` + access/secret key.
2. Reverse proxy (Caddy/Nginx) → `https://s3.tondomaine.com` vers `localhost:8333`.
3. Créer un bucket `aetheris-models`.
4. Me transmettre 3 valeurs (via `add_secret`) :
   - `SEAWEED_S3_ENDPOINT` (ex: `https://s3.tondomaine.com`)
   - `SEAWEED_S3_ACCESS_KEY`
   - `SEAWEED_S3_SECRET_KEY`

## Ce que je vais faire côté code

### 1. Lib serveur `src/lib/seaweed.ts`

- Client S3 minimal en `fetch` + signature **AWS SigV4** (pas de SDK `@aws-sdk/*` lourd, on reste edge-compatible Cloudflare Workers).
- Fonctions : `s3Put`, `s3Get`, `s3List`, `s3Delete`, `s3PresignGet`, `s3PresignPut` (URL pré-signée 1h).
- Bucket par défaut `aetheris-models`, préfixe `users/<user_id>/`.

### 2. Migration DB

- Ajouter colonnes à `user_models` : `storage_provider TEXT DEFAULT 'supabase'` (`supabase` | `seaweed`), `storage_bucket TEXT`, `etag TEXT`.

### 3. Nouvelles commandes terminal (`src/routes/api.terminal.ts`)

- `ls` → liste les objets du préfixe utilisateur sur Seaweed.
- `push <name>` → renvoie une **URL pré-signée PUT** (curl à coller en local) + insère la ligne dans `user_models` avec `storage_provider='seaweed'`.
- `pull <name>` → renvoie une URL pré-signée GET (1h).
- `rm <name>` → supprime l'objet + la ligne DB.
- `storage` → affiche endpoint + bucket + quota utilisé (somme `size_bytes`).
- Mise à jour de `upload` existant pour proposer le choix `--seaweed` vs Supabase.

### 4. Nouvelle route `/api/v1/models/:name/download`

- Auth par clé API (déjà en place via `authenticateApiKey`).
- Redirige (302) vers une URL pré-signée Seaweed → permet à `wget`/`curl`/HuggingFace `from_pretrained` de télécharger directement depuis le VPS sans passer par Lovable.

### 5. UI workspace

- Section "Storage" dans `dashboard.workspace.tsx` : endpoint Seaweed connecté ✓, espace utilisé, bouton "Copier exemple `push`".
- Mise à jour de `docs.tsx` avec section **Stockage de modèles** (curl push/pull, exemple Python).
- Snippet `export-key` enrichi avec la fonction `download_model()`.

## Sécurité

- Toutes les URL pré-signées scopées au préfixe `users/<authenticated_user_id>/` → impossible d'accéder aux fichiers d'un autre user même avec la presigned URL (le path est signé).
- Validation Zod sur les noms de fichiers (regex `[a-zA-Z0-9._-]+`, max 200 chars, pas de `..`).
- TTL court sur les presigned (1h GET, 2h PUT).
- Les secrets `SEAWEED_*` ne sont jamais renvoyés au client.

## Hors-scope (chantiers suivants)

- Connecteur Mongo (chantier 2).
- UI `/dashboard/storage` complète drag&drop (chantier 3).
- Bridge GPU `run hf/...` → ton VPS (chantier 4).

## Action requise après approbation

Je vais te demander via `add_secret` les 3 valeurs Seaweed. Tant qu'elles ne sont pas configurées, la lib renverra un message clair "Seaweed non configuré — voir /docs#storage".
