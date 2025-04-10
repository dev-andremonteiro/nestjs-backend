import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { LotacaoService } from './lotacao.service';
import { CreateLotacaoDto } from './dto/create-lotacao.dto';
import { UpdateLotacaoDto } from './dto/update-lotacao.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Lotacao } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('lotacoes')
export class LotacaoController {
  constructor(private readonly lotacaoService: LotacaoService) {}

  @Post()
  create(@Body() createDto: CreateLotacaoDto): Promise<Lotacao> {
    return this.lotacaoService.create(createDto);
  }

  @Get()
  findAll(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<{ data: Lotacao[]; count: number }> {
    return this.lotacaoService.findAll(paginationQuery);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Lotacao | null> {
    return this.lotacaoService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLotacaoDto,
  ): Promise<Lotacao> {
    return this.lotacaoService.update(id, updateDto);
  }
}
