import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MenuStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  COMPLETED = 'COMPLETED',
}

export class CreateMenuDto {
  @ApiProperty({ example: '2026-07-28' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Branch UUID' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ enum: MenuStatus, default: MenuStatus.DRAFT })
  @IsOptional()
  @IsEnum(MenuStatus)
  status?: MenuStatus;
}
