declare const process: { env: Record<string, string | undefined> };

const clerkIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;

export default {
  // Clerk is optional. When CLERK_JWT_ISSUER_DOMAIN is unset, no auth provider
  // is configured and Convex deploys/runs without authentication — instead of
  // failing the deploy on a missing env var.
  providers: clerkIssuerDomain
    ? [
        {
          domain: clerkIssuerDomain,
          applicationID: "convex",
        },
      ]
    : [],
};
