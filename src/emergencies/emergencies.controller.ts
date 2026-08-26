import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EmergenciesService } from './emergencies.service';
import { ListEmergenciesQueryDto } from './dto/list-emergencies-query.dto';

@ApiTags('emergencies')
@Controller('emergencies')
export class EmergenciesController {
  constructor(private readonly emergenciesService: EmergenciesService) {}

  @Get('categories')
  listCategories() {
    return this.emergenciesService.listCategories();
  }

  @Get()
  list(@Query() query: ListEmergenciesQueryDto) {
    return this.emergenciesService.list(query);
  }

  @Get(':id/guide')
  getGuide(@Param('id') id: string) {
    return this.emergenciesService.getGuide(id);
  }
}
