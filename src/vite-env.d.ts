/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_STRIPE_WEBHOOK_SECRET?: string // For reference only - actual webhook secret is stored in Supabase Edge Functions secrets
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
