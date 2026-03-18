import { config } from 'dotenv'
config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })

async function main() {
  const tables = await db.$queryRaw<any[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `
  console.log('Tables in DB:', tables.map((t:any) => t.table_name).join(', '))

  // Specifically check tables the current code needs
  const needed = ['app_config','players','accounts','instances','nations','archetypes',
    'roles','player_roles','gm_face_modifiers','spatial_maps','map_rooms',
    'spatial_map_anchors','room_presence','instance_export_requests','alchemy_check_ins','alchemy_scene_templates']
  for (const t of needed) {
    const rows = await db.$queryRaw<any[]>`
      SELECT COUNT(*) as c FROM information_schema.tables
      WHERE table_schema='public' AND table_name=${t}`
    const exists = Number((rows[0] as any).c) > 0
    if (!exists) console.log(`MISSING TABLE: ${t}`)
  }
  console.log('Table check complete')
}
main().catch(e => console.error(e.message)).finally(() => db.$disconnect())
