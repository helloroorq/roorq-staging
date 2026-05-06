import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const loadEnvFile = (path: string) => {
  if (!existsSync(path)) {
    return
  }

  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) {
      continue
    }
    const [key, ...valueParts] = line.split('=')
    if (!key || process.env[key]) {
      continue
    }
    process.env[key] = valueParts.join('=').replace(/^["']|["']$/g, '')
  }
}

loadEnvFile(resolve(process.cwd(), '../../apps/web/.env.local'))
loadEnvFile(resolve(process.cwd(), '.env.local'))

process.env.SUPABASE_URL ??= process.env.NEXT_PUBLIC_SUPABASE_URL
process.env.SUPABASE_ANON_KEY ??= process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const requireEnv = (name: string): string => {
  const v = process.env[name]
  if (!v) {
    throw new Error(`Missing env: ${name}`)
  }
  return v
}

export const env = {
  port: Number(process.env.PORT ?? '4000'),
  databaseUrl: requireEnv('DATABASE_URL'),
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseAnonKey: requireEnv('SUPABASE_ANON_KEY'),
  karmaInternalApiKey: requireEnv('KARMA_INTERNAL_API_KEY'),
  corsOrigin: process.env.CORS_ORIGIN ?? true,
}
