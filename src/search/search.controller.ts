import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiQuery({ name: 'q', required: true, description: 'Termo de busca' })
  search(@Query('q') q: string) {
    return this.searchService.search(q ?? '');
  }
}
