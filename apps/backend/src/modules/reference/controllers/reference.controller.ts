import { ReferenceService } from '@/modules/reference/services/reference.service';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReferenceResponseDto } from './dto/reference-response.dto';

@ApiTags('reference')
@Controller('reference')
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Get()
  @ApiOperation({
    summary: 'Get reference data',
    description: 'Returns read-only reference data: tags and cities',
  })
  @ApiResponse({
    status: 200,
    description: 'Reference data retrieved successfully',
    type: ReferenceResponseDto,
  })
  async getReference(): Promise<ReferenceResponseDto> {
    return this.referenceService.getReferenceData();
  }
}
