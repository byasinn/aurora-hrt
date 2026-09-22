/** Bindings do Worker — declarados aqui à mão porque secrets não aparecem no wrangler.toml. */
export interface Env {
  ASSETS: Fetcher
  IMAGES: R2Bucket
  DATABASE_URL: string
  ENVIRONMENT?: string
  VAPID_PUBLIC_KEY: string
  VAPID_PRIVATE_KEY: string
  VAPID_SUBJECT: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  RESEND_API_KEY: string
  EMAIL_FROM: string
  BOOTSTRAP_SECRET: string
  SIGHTENGINE_API_USER?: string
  SIGHTENGINE_API_SECRET?: string
}
