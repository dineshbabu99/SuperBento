import { Module } from '@nestjs/common';
import { IngredientsModule } from './ingredients/ingredients.module';
import { RecipesModule } from './recipes/recipes.module';
import { MenusModule } from './menus/menus.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [IngredientsModule, RecipesModule, MenusModule, TasksModule]
})
export class KitchenModule {}
