import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const databaseUrl = (() => {
  if (!process.env.DATABASE_URL) return undefined

  const url = new URL(process.env.DATABASE_URL)
  url.searchParams.set('sslmode', 'verify-full')
  return url.toString()
})()

export const pool = new Pool({
  connectionString: databaseUrl,
})

export const db = drizzle(pool, { schema })
