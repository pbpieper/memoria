/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Set by Vercel at build time: 'production' or 'preview'. Missing in local runs. */
  readonly VITE_VERCEL_ENV?: string
  readonly VITE_VERCEL_GIT_COMMIT_SHA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
