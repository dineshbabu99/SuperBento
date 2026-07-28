import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRecipeDto {
  @ApiProperty({ example: 'Grilled Chicken Salad' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'A healthy and quick grilled chicken salad.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '1. Grill chicken. 2. Toss with salad.' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  prepTimeMinutes?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  cookTimeMinutes?: number;

  @ApiPropertyOptional({ example: 'Salads' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: { calories: 350, protein: 45 } })
  @IsOptional()
  @IsObject()
  nutritionalInfo?: any;
}
