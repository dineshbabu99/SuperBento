import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { AddPoItemDto } from './dto/add-po-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PurchaseOrderStatus } from '@prisma/client';

@ApiTags('Purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  @ApiOperation({ summary: 'List purchase orders (paginated)' })
  findAll(
    @Query('status') status?: PurchaseOrderStatus,
    @Query('supplierId') supplierId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.purchasesService.findAll({
      status,
      supplierId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order detail' })
  findOne(@Param('id') id: string) {
    return this.purchasesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new draft purchase order' })
  create(@Body() dto: CreatePurchaseOrderDto, @Request() req: any) {
    return this.purchasesService.create(dto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a draft purchase order' })
  update(@Param('id') id: string, @Body() dto: Partial<CreatePurchaseOrderDto>) {
    return this.purchasesService.update(id, dto);
  }

  @Patch(':id/submit')
  @ApiOperation({ summary: 'Submit PO for approval' })
  submit(@Param('id') id: string) {
    return this.purchasesService.submit(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a submitted PO' })
  approve(@Param('id') id: string, @Request() req: any) {
    return this.purchasesService.approve(id, req.user.id);
  }

  @Patch(':id/receive')
  @ApiOperation({ summary: 'Mark PO as received — auto-updates inventory' })
  receive(@Param('id') id: string, @Request() req: any) {
    return this.purchasesService.receive(id, req.user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a purchase order' })
  cancel(@Param('id') id: string) {
    return this.purchasesService.cancel(id);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add a line item to a PO' })
  addItem(@Param('id') id: string, @Body() dto: AddPoItemDto) {
    return this.purchasesService.addItem(id, dto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remove a line item from a PO' })
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.purchasesService.removeItem(id, itemId);
  }
}
