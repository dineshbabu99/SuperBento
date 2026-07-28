import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding temp data for Kitchen and Inventory...');

  // Get the default branch (SuperBento HQ)
  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'SuperBento HQ — Chennai',
        code: 'HQ01',
      }
    });
  }

  // 1. Create Ingredients
  const rice = await prisma.ingredient.create({
    data: { name: 'Basmati Rice', unit: 'kg', defaultCost: 60 }
  });
  const chicken = await prisma.ingredient.create({
    data: { name: 'Chicken Breast', unit: 'kg', defaultCost: 250 }
  });
  const tomatoes = await prisma.ingredient.create({
    data: { name: 'Tomatoes', unit: 'kg', defaultCost: 40 }
  });
  const broccoli = await prisma.ingredient.create({
    data: { name: 'Broccoli', unit: 'kg', defaultCost: 120 }
  });
  const soySauce = await prisma.ingredient.create({
    data: { name: 'Soy Sauce', unit: 'L', defaultCost: 150 }
  });

  // 2. Create Recipes and link RecipeIngredients
  const chickenBento = await prisma.recipe.create({
    data: {
      name: 'Teriyaki Chicken Bento',
      description: 'Classic Japanese bento box with teriyaki chicken, steamed rice, and broccoli.',
      prepTimeMinutes: 15,
      cookTimeMinutes: 30,
      category: 'Non-Veg Bento',
      ingredients: {
        create: [
          { ingredientId: rice.id, quantity: 0.15, unit: 'kg' },
          { ingredientId: chicken.id, quantity: 0.2, unit: 'kg' },
          { ingredientId: broccoli.id, quantity: 0.1, unit: 'kg' },
          { ingredientId: soySauce.id, quantity: 0.02, unit: 'L' },
        ]
      }
    }
  });

  const vegBento = await prisma.recipe.create({
    data: {
      name: 'Healthy Veggie Bento',
      description: 'Nutritious vegetarian bento featuring steamed veggies and rice.',
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      category: 'Veg Bento',
      ingredients: {
        create: [
          { ingredientId: rice.id, quantity: 0.2, unit: 'kg' },
          { ingredientId: broccoli.id, quantity: 0.15, unit: 'kg' },
          { ingredientId: tomatoes.id, quantity: 0.1, unit: 'kg' },
        ]
      }
    }
  });

  // 3. Create Inventory Items (Stocking up the branch)
  await prisma.inventoryItem.createMany({
    data: [
      { ingredientId: rice.id, branchId: branch.id, currentStock: 50, minStockLevel: 10, unit: 'kg' },
      { ingredientId: chicken.id, branchId: branch.id, currentStock: 20, minStockLevel: 5, unit: 'kg' },
      { ingredientId: tomatoes.id, branchId: branch.id, currentStock: 15, minStockLevel: 5, unit: 'kg' },
      { ingredientId: broccoli.id, branchId: branch.id, currentStock: 8, minStockLevel: 10, unit: 'kg' },
      { ingredientId: soySauce.id, branchId: branch.id, currentStock: 5, minStockLevel: 2, unit: 'L' },
    ]
  });

  console.log('✅ Temporary data seeded successfully!');
  console.log(`Created Recipes: ${chickenBento.name}, ${vegBento.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
