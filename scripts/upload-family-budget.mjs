/** Upload the approved workbook as a private Blob; never place it in /public. */
import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { put } from '@vercel/blob'

const source = process.argv[2]
if (!source) throw new Error('Usage: node scripts/upload-family-budget.mjs /absolute/path/to/90-day-parent-support-budget.xlsx')
const token = process.env.FAMILY_ROOM_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN
if (!token) throw new Error('FAMILY_ROOM_BLOB_READ_WRITE_TOKEN is required.')

const file = resolve(source)
const body = await readFile(file)
const blob = await put(`family-room/${basename(file)}`, body, {
  access: 'private',
  token,
  addRandomSuffix: false,
  contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
})
console.log(`Set FAMILY_ROOM_BUDGET_BLOB_URL=${blob.url}`)
