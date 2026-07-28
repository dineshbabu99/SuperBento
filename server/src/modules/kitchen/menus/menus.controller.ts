import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Kitchen - Menus')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kitchen/menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get()
  @ApiOperation({ summary: 'Get all daily menus' })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  findAll(@Query('date') date?: string, @Query('branchId') branchId?: string) {
    return this.menusService.findAll({ date, branchId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single daily menu with items and prep tasks' })
  findOne(@Param('id') id: string) {
    return this.menusService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new daily menu' })
  create(@Body() dto: CreateMenuDto) {
    return this.menusService.create(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update daily menu status' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.menusService.updateStatus(id, status);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add a recipe to a daily menu' })
  addMenuItem(
    @Param('id') id: string,
    @Body() dto: { recipeId: string; mealType: string; targetQuantity?: number },
  ) {
    return this.menusService.addMenuItem(id, dto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remove a recipe from a daily menu' })
  removeMenuItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.menusService.removeMenuItem(id, itemId);
  }
}

