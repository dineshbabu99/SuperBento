import { IsUUID, IsOptional, IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeliveryStopDto {
  @ApiProperty({ example: 'Arun Kumar' })
  @IsString()
  customerName: string;

  @ApiProperty({ example: '12 Lotus Street, Velachery, Chennai - 600042' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateDeliveryBatchDto {
  @ApiPropertyOptional({ example: 'uuid-of-daily-menu' })
  @IsOptional()
  @IsUUID()
  dailyMenuId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-branch' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-delivery-agent' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ example: '2026-07-27T08:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 'Morning delivery run' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [DeliveryStopDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryStopDto)
  stops?: DeliveryStopDto[];
}
