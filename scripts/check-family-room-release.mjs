const required = [
  'DATABASE_URL',
  'FAMILY_ROOM_PASSWORD',
  'FAMILY_ROOM_SESSION_SECRET',
  'FAMILY_ROOM_BLOB_READ_WRITE_TOKEN',
  'FAMILY_ROOM_BUDGET_BLOB_URL',
]

const missing = required.filter((key) => !process.env[key])
if (missing.length) {
  console.error(`Family room is not ready to release. Missing: ${missing.join(', ')}`)
  process.exit(1)
}
console.log('Family room release environment is configured.')
