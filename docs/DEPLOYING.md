# Deploying ThinkCode

ThinkCode is a single Next.js app served by one Cloudflare Worker, with one D1
database behind it. There is no container, no build server and no environment
matrix — `main` is production.

## What is deployed where

| Piece            | Where                                                          |
| ---------------- | -------------------------------------------------------------- |
| App + worker     | Cloudflare Workers, name `thinkcode`                            |
| Database         | Cloudflare D1, name `thinkcode-db`, bound as `DB`               |
| Live URL         | `https://thinkcode.cast-cue.workers.dev`                        |
| Credentials      | GitHub Actions secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |

The D1 `database_id` is committed in `wrangler.jsonc`. It is a resource
identifier, not a credential, so it belongs in version control — which is also
what lets a fresh clone deploy without a manual copy-paste step.

## Deploying

```bash
# Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment.
npm run deploy
```

That runs `opennextjs-cloudflare build` and then `opennextjs-cloudflare deploy`,
which uploads the assets, switches the worker version and prints the URL.

Once the two secrets exist in the repository, **merging to `main` deploys by
itself** — see `.github/workflows/deploy.yml`. That workflow lints, typechecks,
builds, deploys, and then curls the live worker to prove it answers, so a green
check on a PR is a real promise about production rather than a vibe.

## Migrations

```bash
npm run db:migrate:remote   # apply migrations + seed to the real D1
npm run db:migrate:local    # same, against local miniflare
npm run db:reset:local      # wipe local state and re-apply
```

Migrations are **not** run by CI, on purpose. A schema change should be a
deliberate, reviewed act; silently migrating production because someone merged a
button colour is how a database and its app drift apart. Run it locally, check
it, push the file.

Every statement in `migrations/` is written to be safe to re-run — `CREATE TABLE
IF NOT EXISTS`, `INSERT OR IGNORE` — so applying the same migration twice is a
no-op. That is also why the seed is a migration rather than a separate script:
there is no second thing to forget to run.

## Verifying a deploy

```bash
url=https://thinkcode.cast-cue.workers.dev
for p in / /problems /problems/p1 /patterns /knowledge /review /settings /tags; do
  printf '%-16s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' "$url$p")"
done
```

If a page 404s with `error code: 1042` the worker is still propagating across
Cloudflare's edge. Wait a few seconds and try again — a fresh deploy routinely
answers `404` for a handful of seconds while the version rolls out. The deploy
workflow retries for exactly this reason.

## Credentials

The API token needs three permissions on the account:

| Scope                   | Permission           |
| ----------------------- | -------------------- |
| Account → Workers Scripts | Edit                |
| Account → D1             | Edit                |
| Account → Account Settings | Read              |

Create one at <https://dash.cloudflare.com/profile/api-tokens> using the *Edit
Cloudflare Workers* template plus D1 Edit. Keep it out of the repository: it
belongs in the environment, in `.dev.vars` (git-ignored), or in the GitHub
secrets above. Because a token pasted into a chat or a terminal is a token in
someone's history, rotating it after a first successful deploy is a reasonable
habit.

```bash
gh secret set CLOUDFLARE_API_TOKEN  --repo AmineMabrouk17/ThinkCode
gh secret set CLOUDFLARE_ACCOUNT_ID --repo AmineMabrouk17/ThinkCode
```

`CLOUDFLARE_ACCOUNT_ID` is not secret, but it is environment-specific, so it
stays a secret too rather than being hardcoded into a workflow.

## Adding a route to this list

If you add a page, add it to the smoke test in `deploy.yml` and to the loop
above. A deploy that nobody checks is a deploy that is only probably working.
