import {
  Controller, Get, Post, Patch,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryBatchDto } from './dto/create-delivery-batch.dto';
import { UpdateStopStatusDto } from './dto/update-stop-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DeliveryStatus } from '@prisma/client';

@ApiTags('Delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('batches')
  @ApiOperation({ summary: 'List delivery batches' })
  findBatches(
    @Query('status') status?: DeliveryStatus,
    @Query('branchId') branchId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.deliveryService.findBatches({
      status,
      branchId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('batches/:id')
  @ApiOperation({ summary: 'Get delivery batch with all stops' })
  findBatch(@Param('id') id: string) {
    return this.deliveryService.findBatch(id);
  }

  @Post('batches')
  @ApiOperation({ summary: 'Create a new delivery batch' })
  createBatch(@Body() dto: CreateDeliveryBatchDto) {
    return this.deliveryService.createBatch(dto);
  }

  @Patch('batches/:id/status')
  @ApiOperation({ summary: 'Update delivery batch status' })
  updateBatchStatus(
    @Param('id') id: string,
    @Body('status') status: DeliveryStatus,
  ) {
    return this.deliveryService.updateBatchStatus(id, status);
  }

  @Patch('batches/:id/stops/:stopId')
  @ApiOperation({ summary: 'Update delivery stop status' })
  updateStopStatus(
    @Param('id') id: string,
    @Param('stopId') stopId: string,
    @Body() dto: UpdateStopStatusDto,
  ) {
    return this.deliveryService.updateStopStatus(id, stopId, dto);
  }
}
