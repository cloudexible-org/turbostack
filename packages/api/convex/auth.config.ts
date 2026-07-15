// Auth is currently off: no auth provider is configured, so `convex deploy`
// succeeds on every deployment (production and Vercel preview builds alike).
//
// NOTE: do NOT reference `process.env.CLERK_JWT_ISSUER_DOMAIN` here to make Clerk
// "optional". Convex requires every env var *referenced* by this file to be set
// on the target deployment, regardless of runtime `if`/ternary guards — so a
// bare reference fails the deploy anywhere the var is unset (e.g. previews).
//
// To enable Clerk: set CLERK_JWT_ISSUER_DOMAIN on the Convex deployment(s), then
// add the provider back:
//   providers: [{ domain: process.env.CLERK_JWT_ISSUER_DOMAIN, applicationID: "convex" }]
export default {
  providers: [],
};
