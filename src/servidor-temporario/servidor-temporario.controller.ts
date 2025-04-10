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
import { ServidorTemporarioService } from './servidor-temporario.service';
import { CreateServidorTemporarioDto } from './dto/create-servidor-temporario.dto';
import { UpdateServidorTemporarioDto } from './dto/update-servidor-temporario.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ServidorTemporario } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('servidores-temporarios')
export class ServidorTemporarioController {
  constructor(
    private readonly servidorTemporarioService: ServidorTemporarioService,
  ) {}

  @Post()
  create(
    @Body() createDto: CreateServidorTemporarioDto,
  ): Promise<ServidorTemporario> {
    return this.servidorTemporarioService.create(createDto);
  }

  @Get()
  findAll(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<{ data: ServidorTemporario[]; count: number }> {
    return this.servidorTemporarioService.findAll(paginationQuery);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ServidorTemporario | null> {
    return this.servidorTemporarioService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateServidorTemporarioDto,
  ): Promise<ServidorTemporario> {
    return this.servidorTemporarioService.update(id, updateDto);
  }
}
