import {
  Controller,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { CidadeService } from './cidade.service';
import { CreateCidadeDto } from './dto/create-cidade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Cidade } from '@prisma/client';

@Controller('cidades')
export class CidadeController {
  constructor(private readonly cidadeService: CidadeService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    createCidadeDto: CreateCidadeDto,
  ): Promise<Cidade> {
    return this.cidadeService.create(createCidadeDto);
  }

  // Add other endpoints (GET, PATCH, DELETE) later
}
