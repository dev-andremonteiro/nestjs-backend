import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust path if needed
import { CreateCidadeDto } from './dto/create-cidade.dto';
import { Cidade } from '@prisma/client';

@Injectable()
export class CidadeService {
  constructor(private prisma: PrismaService) {}

  async create(createCidadeDto: CreateCidadeDto): Promise<Cidade> {
    return this.prisma.cidade.create({
      data: createCidadeDto,
    });
  }

  // Add other methods like findAll, findOne, update, remove later
}
