import { IsMongoId, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddPoItemDto {
  @ApiProperty({ example: 'uuid-of-ingredient' })
  @IsMongoId()
  ingredientId: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ example: 'kg' })
  @IsString()
  unit: string;

  @ApiProperty({ example: 120.5 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}
