const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'superadmin@superbento.com', deletedAt: null },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });
    console.log(user);
  } catch (e) {
    console.log("NAME:", e.name);
    console.log("CODE:", e.code);
    console.log("META:", e.meta);
    console.log("MESSAGE:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
