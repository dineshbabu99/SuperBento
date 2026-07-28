import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('System Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ── Settings ──────────────────────────────────────────

  @Get('settings')
  @ApiOperation({ summary: 'Get global system settings' })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Post('settings')
  @ApiOperation({ summary: 'Bulk update global system settings' })
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(dto.settings);
  }

  // ── Branches ──────────────────────────────────────────

  @Get('branches')
  @ApiOperation({ summary: 'List all branches' })
  findBranches() {
    return this.settingsService.findBranches();
  }

  @Post('branches')
  @ApiOperation({ summary: 'Create a new operational branch' })
  createBranch(@Body() dto: CreateBranchDto, @Request() req: any) {
    return this.settingsService.createBranch(dto, req.user.id);
  }

  @Patch('branches/:id')
  @ApiOperation({ summary: 'Update branch properties' })
  updateBranch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateBranchDto>,
    @Request() req: any,
  ) {
    return this.settingsService.updateBranch(id, dto, req.user.id);
  }

  @Delete('branches/:id')
  @ApiOperation({ summary: 'Soft delete a branch' })
  removeBranch(@Param('id', ParseUUIDPipe) id: string) {
    return this.settingsService.removeBranch(id);
  }
}
