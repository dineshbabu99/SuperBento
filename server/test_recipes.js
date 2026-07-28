const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const recipes = await prisma.recipe.findMany();
  console.log('Recipes:', recipes);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
