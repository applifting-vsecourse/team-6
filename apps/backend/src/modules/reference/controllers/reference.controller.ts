import { ReferenceService } from '@/modules/reference/services/reference.service';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReferenceDto } from './dto/reference.dto';

@ApiTags('reference')
@Controller('reference')
export class ReferenceController {
  constructor(private readonly service: ReferenceService) {}

  @Get()
  @ApiOperation({
    summary: 'Reference data',
    description: 'Read-only lists the UI offers to pick from. Public.',
  })
  get(): Promise<ReferenceDto> {
    return this.service.get();
  }
}
