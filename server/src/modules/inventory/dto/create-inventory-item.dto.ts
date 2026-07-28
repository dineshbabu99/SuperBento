import { IsString, IsNumber, IsOptional, IsMongoId, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'uuid-of-ingredient' })
  @IsMongoId()
  ingredientId: string;

  @ApiPropertyOptional({ example: 'uuid-of-branch' })
  @IsOptional()
  @IsMongoId()
  branchId?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStockLevel?: number;

  @ApiProperty({ example: 'kg' })
  @IsString()
  unit: string;
}
