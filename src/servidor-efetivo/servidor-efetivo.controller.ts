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
import { ServidorEfetivoService } from './servidor-efetivo.service';
import { CreateServidorEfetivoDto } from './dto/create-servidor-efetivo.dto';
import { UpdateServidorEfetivoDto } from './dto/update-servidor-efetivo.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ServidorEfetivo } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('servidores-efetivos')
export class ServidorEfetivoController {
  constructor(
    private readonly servidorEfetivoService: ServidorEfetivoService,
  ) {}

  @Post()
  create(
    @Body() createServidorEfetivoDto: CreateServidorEfetivoDto,
  ): Promise<ServidorEfetivo> {
    return this.servidorEfetivoService.create(createServidorEfetivoDto);
  }

  @Get()
  findAll(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<{ data: ServidorEfetivo[]; count: number }> {
    return this.servidorEfetivoService.findAll(paginationQuery);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ServidorEfetivo | null> {
    return this.servidorEfetivoService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServidorEfetivoDto: UpdateServidorEfetivoDto,
  ): Promise<ServidorEfetivo> {
    return this.servidorEfetivoService.update(id, updateServidorEfetivoDto);
  }
}
