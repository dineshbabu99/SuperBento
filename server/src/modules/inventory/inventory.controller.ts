import {
  Controller, Get, Post, Patch,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List all inventory items' })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.findAll({ branchId, search });
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get low-stock alerts' })
  getLowStockAlerts(@Query('branchId') branchId?: string) {
    return this.inventoryService.getLowStockAlerts(branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory item by ID with movement history' })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create inventory item for an ingredient' })
  create(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inventory item (min stock, unit)' })
  update(
    @Param('id') id: string,
    @Body() dto: { minStockLevel?: number; unit?: string },
  ) {
    return this.inventoryService.update(id, dto);
  }

  @Post(':id/adjust')
  @ApiOperation({ summary: 'Record a stock adjustment' })
  adjustStock(
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
    @Request() req: any,
  ) {
    return this.inventoryService.adjustStock(id, dto, req.user.id);
  }
}
