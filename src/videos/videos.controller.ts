import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { VideosService } from './videos.service';

@ApiTags('videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get()
  @ApiQuery({ name: 'categoryId', required: false })
  list(@Query('categoryId') categoryId?: string) {
    return this.videosService.list(categoryId);
  }
}
