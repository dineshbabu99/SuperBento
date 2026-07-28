const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const argon2 = require('argon2');
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
    console.log("User found:", !!user);
    if (user) {
      const isValid = await argon2.verify(user.passwordHash, 'SuperBento@2024!');
      console.log("Password valid:", isValid);
      console.log("Status:", user.status);
    }
  } catch (e) {
    console.log("ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
