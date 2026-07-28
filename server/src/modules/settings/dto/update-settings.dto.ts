import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiProperty({ example: { companyName: 'SuperBento Chennai', taxRate: '5' } })
  @IsObject()
  settings: Record<string, string>;
}
