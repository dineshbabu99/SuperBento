import { IsString, IsNumber, IsUUID, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertEmployeeDto {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'Delivery Executive' })
  @IsString()
  designation: string;

  @ApiProperty({ example: 'Delivery' })
  @IsString()
  department: string;

  @ApiProperty({ example: 18000 })
  @IsNumber()
  @Min(0)
  monthlySalary: number;

  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  joiningDate: string;

  @ApiPropertyOptional({ example: 'HDFC Bank' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: '98765432109' })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'HDFC0004321' })
  @IsOptional()
  @IsString()
  ifscCode?: string;
}
