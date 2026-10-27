### Added
- **Every PostHog event carries `product` and `surface` (`packages/analytics`, `apps/www`, `apps/app`):** `AnalyticsProvider` takes two new required props and stamps them onto every event in `before_send`; `apps/www` passes `product="turbostack" surface="www"`, `apps/app` `product="turbostack" surface="app"`. Forks rename `product` (now in the `AGENTS.md` §8 checklist). *Why:* products are being consolidated into one shared PostHog project, where `$host` can't reliably tell them apart. `before_send` rather than `register` because super-properties persist in a cookie shared across subdomains, so one surface could inherit another's stale values; stamping at send time cannot drift.

### Changed
- **PostHog `defaults: "2026-06-25"` (`packages/analytics`):** opts into PostHog's current defaults, chiefly `capture_pageview: "history_change"`, so client-side navigations in both apps now record pageviews instead of only hard loads. Expect pageview counts to rise from this change on.
