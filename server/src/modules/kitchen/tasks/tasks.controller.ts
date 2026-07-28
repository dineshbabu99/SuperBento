import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Kitchen - Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kitchen/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all prep tasks' })
  @ApiQuery({ name: 'dailyMenuId', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query('dailyMenuId') dailyMenuId?: string,
    @Query('status') status?: string,
  ) {
    return this.tasksService.findAll({ dailyMenuId, status });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update prep task status' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.tasksService.updateStatus(id, status);
  }
}

