import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GeneratePayrollDto {
  @ApiProperty({ example: '2026-07', description: 'Pay period in YYYY-MM format' })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'payPeriod must be in YYYY-MM format' })
  payPeriod: string;
}
