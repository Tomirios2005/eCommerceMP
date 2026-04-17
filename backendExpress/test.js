// test.js
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('✅ Prisma Client funcionando correctamente')
  const result = await prisma.$queryRaw`SELECT NOW()`
  console.log('✅ Conexión a DB exitosa:', result)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())