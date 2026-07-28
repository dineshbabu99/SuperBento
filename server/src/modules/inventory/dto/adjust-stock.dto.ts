import { IsEnum, IsNumber, IsOptional, IsString, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';

export class AdjustStockDto {
  @ApiProperty({ enum: StockMovementType, example: 'ADJUSTMENT' })
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @ApiProperty({ example: 15.5, description: 'Positive to add, negative to subtract' })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ example: 'Monthly stock count correction' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'uuid-reference' })
  @IsOptional()
  @IsMongoId()
  referenceId?: string;
}
