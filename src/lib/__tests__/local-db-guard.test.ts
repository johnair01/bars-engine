import { describe, expect, it } from 'vitest'
import { databaseHost, isLocalDatabaseUrl, remoteDatabaseRefused } from '../local-db-guard'

describe('local-db-guard (docs/LOCAL_FIRST_TESTING.md)', () => {
  it('treats localhost, 127.0.0.1 and ::1 as local', () => {
    expect(isLocalDatabaseUrl('postgresql://postgres:postgres@127.0.0.1:5432/bars?schema=public')).toBe(true)
    expect(isLocalDatabaseUrl('postgresql://postgres@localhost:54329/bars')).toBe(true)
    expect(isLocalDatabaseUrl('postgres://u:p@[::1]:5432/bars')).toBe(true)
  })

  it('treats a hosted database as remote', () => {
    const prod = 'postgres://u:p@db.prisma.io:5432/postgres?sslmode=require'
    expect(databaseHost(prod)).toBe('db.prisma.io')
    expect(isLocalDatabaseUrl(prod)).toBe(false)
    expect(isLocalDatabaseUrl('prisma+postgres://accelerate.prisma-data.net/?api_key=x')).toBe(false)
  })

  it('refuses a remote database outside Vercel unless BARS_ALLOW_REMOTE_DB=1', () => {
    const prod = 'postgres://u:p@db.prisma.io:5432/postgres'
    expect(remoteDatabaseRefused(prod, {})).toBe(true)
    expect(remoteDatabaseRefused(prod, { BARS_ALLOW_REMOTE_DB: '1' })).toBe(false)
    expect(remoteDatabaseRefused(prod, { VERCEL: '1' })).toBe(false)
    expect(remoteDatabaseRefused('postgresql://postgres@127.0.0.1:5432/bars', {})).toBe(false)
  })
})
