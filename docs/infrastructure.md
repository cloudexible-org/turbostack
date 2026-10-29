# Infrastructure & environments

Where a Turbostack project runs and how a change gets from a pull request to
production. Kept here because none of it can be worked out from the code. The
values below are Turbostack's own deployment; a fork replaces them with its own
(see the forking checklist in `AGENTS.md`).

## Branches

| Branch | Deploys to | How |
|---|---|---|
| `main` | staging | `.github/workflows/deploy-staging.yml` on every push |
| `prod` | production | Vercel's Git integration |

Work reaches `main` through pull requests. You promote to production by opening
a PR from `main` into `prod`. Nothing is pushed to either branch directly.

## Environments

| | Production | Staging | Local (`pnpm dev`) |
|---|---|---|---|
| App (`turbostack-app`) | `https://turbostack-app.vercel.app` | the project's `staging` environment URL | `https://app.turbostack.localhost` |
| Website (`turbostack`) | `https://turbostack.cloudexible.com` | `https://turbostack-staging.cloudexible.com` | `https://www.turbostack.localhost` |
| Convex deployment | `prod` | `staging` (dev type) | your `dev` deployment |
| Clerk instance | production | development | development |

Staging is deliberately a **dev-type** Convex deployment, not a second
production one. That leaves exactly one `--type=prod` deployment in the project,
so it is always clear which one is production. The trade-off: dev deployments
send server error details to the client, and production withholds anything not
wrapped in a `ConvexError`. Staging therefore can't prove that error handling
meant for production is correct.

### Staging shares Clerk's development instance

Staging and local development authenticate against the same Clerk development
instance, so a test user signs in to either with the same password. Staging
therefore shows Clerk's "Development mode" badge, and is subject to the
development instance's limits (100 users, no custom email sender). Because
users are shared, a Clerk user deleted while testing locally is gone from
staging too.

Each Convex deployment's `CLERK_JWT_ISSUER_DOMAIN` must be the issuer of the
instance whose publishable key the frontend in front of it was built with. A
mismatch fails every authenticated query.

## Vercel

Two projects, one per app. Each has a `staging` custom environment next to
Production. The build command in `apps/<app>/vercel.json` is the same in every
environment, so which Convex deployment a build deploys to is decided
**entirely** by the `CONVEX_DEPLOY_KEY` in scope.

| Vercel environment | Branch | `CONVEX_DEPLOY_KEY` scoped to |
|---|---|---|
| Production | `prod` | Convex `prod` |
| `staging` (custom) | `main`, via the workflow | Convex `staging` |

Both projects deploy the Convex functions on every build, so one push to
`main` may deploy the same functions to `staging` twice. That is harmless,
because `convex deploy` is idempotent.

**Only `prod` deploys on push.** `apps/*/vercel.json` sets
`git.deploymentEnabled` to `{"**": false, "prod": true}`, so no other branch,
`main` included, creates a Vercel deployment or a Vercel check on its PR. Set
each project's Production Branch to `prod` to match.

**Staging is deployed by GitHub Actions.** Vercel refuses a Git deployment of a
commit whose author isn't on the Vercel team, which would shut out PRs from
@cloudexible-juno. A CLI deployment belongs to the token's owner instead. The
workflow runs on every push to `main` and, for each app whose build the push
affects (`turbo query affected` against the commit before the push), runs
`vercel deploy --target=staging`. It deploys a `git archive` of the commit,
not the checkout: given a `.git`, the CLI sends the commit's metadata along,
and Vercel then blocks a non-member's commit even when it comes from a token.
To redeploy by hand, run the workflow from the Actions tab. A manual run
deploys both apps whatever changed.

The archive has no `.git`, which is why the root `prepare` script skips
`lefthook install` outside a git repository: otherwise every staging build
would fail at `pnpm install`.

The workflow reads its configuration from the repository, so the template
carries no IDs. Until all four are set, each job skips with a notice instead of
failing:

| Name | Kind | Value |
|---|---|---|
| `VERCEL_TOKEN` | secret | A token created by a member of the team and scoped to it |
| `VERCEL_ORG_ID` | variable | The Vercel team ID (`team_…`) |
| `VERCEL_PROJECT_ID_APP` | variable | The `apps/app` project ID (`prj_…`) |
| `VERCEL_PROJECT_ID_WWW` | variable | The `apps/www` project ID (`prj_…`) |

```sh
gh secret set VERCEL_TOKEN
gh variable set VERCEL_ORG_ID --body team_…
gh variable set VERCEL_PROJECT_ID_APP --body prj_…
gh variable set VERCEL_PROJECT_ID_WWW --body prj_…
```

Keep the staging deploy key out of Preview scope. Whatever key is there is
what every preview build deploys to, so each PR would redeploy staging
underneath whoever is testing on it.

## Setting up staging

Once per project, after its production deployment works:

1. **Convex:** create a deployment named `staging` of type dev, and set its
   `CLERK_JWT_ISSUER_DOMAIN` to the Clerk development instance's issuer.
2. **Vercel, each project:** add a `staging` custom environment, then set its
   `CONVEX_DEPLOY_KEY` (the `staging` deployment's deploy key) and the Clerk
   development keys from the table below. Optionally give it a domain.
3. **Vercel, each project:** set the Production Branch to `prod`.
4. **GitHub:** create the `prod` branch from `main`, and set the secret and
   variables above.
5. Push to `main`, or run the workflow by hand, and check both staging URLs.

## Environment variables

`apps/app/.env.example` and `apps/www/.env.example` list what each app needs.
Production and staging values are set per **Vercel environment**. Local values
come from Doppler (`doppler.yaml`).

| Variable | Production | `staging` |
|---|---|---|
| `CONVEX_DEPLOY_KEY` | Convex `prod` deploy key | Convex `staging` deploy key |
| `VITE_CLERK_PUBLISHABLE_KEY` (app) | `pk_live_…` | `pk_test_…` (development instance) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (www) | `pk_live_…` | `pk_test_…` (development instance) |
| `CLERK_SECRET_KEY` (www) | `sk_live_…` | `sk_test_…` (development instance) |

The Convex URL variables (`VITE_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_URL`) are not
set in Vercel: `convex deploy --cmd-url-env-var-name` injects them into the
build from the deploy key's deployment.

Variables prefixed `VITE_` and `NEXT_PUBLIC_` are inlined at build time, so
changing one takes a redeploy of that environment, not just a save in Vercel.

Variables the Convex functions read (`CLERK_JWT_ISSUER_DOMAIN`) are set on the
Convex deployment itself, not in Vercel.
