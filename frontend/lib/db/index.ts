import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
}

function createPool() {
  if (!connectionString) return null
  return new Pool({
    connectionString,
    ssl:
      connectionString.includes("localhost") ||
      connectionString.includes("127.0.0.1")
        ? undefined
        : { rejectUnauthorized: false },
  })
}

const pool = globalForDb.pool ?? createPool()

if (process.env.NODE_ENV !== "production" && pool) {
  globalForDb.pool = pool
}

export const db = pool ? drizzle(pool, { schema }) : null

export function isDbConfigured() {
  return Boolean(db)
}
