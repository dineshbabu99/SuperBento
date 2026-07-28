import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Kitchen - Ingredients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kitchen/ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all ingredients' })
  findAll() {
    return this.ingredientsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new ingredient' })
  create(@Body() dto: CreateIngredientDto) {
    return this.ingredientsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an ingredient' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateIngredientDto>) {
    return this.ingredientsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an ingredient (soft delete)' })
  remove(@Param('id') id: string) {
    return this.ingredientsService.remove(id);
  }
}

