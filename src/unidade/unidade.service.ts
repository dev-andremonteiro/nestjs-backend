import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnidadeDto } from './dto/create-unidade.dto';
import { UpdateUnidadeDto } from './dto/update-unidade.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Unidade } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class UnidadeService {
  constructor(private prisma: PrismaService) {}

  async create(createUnidadeDto: CreateUnidadeDto): Promise<Unidade> {
    return this.prisma.unidade.create({
      data: createUnidadeDto,
    });
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: Unidade[]; count: number }> {
    const { skip, take } = paginationQuery;
    const [data, count] = await this.prisma.$transaction([
      this.prisma.unidade.findMany({ skip, take }),
      this.prisma.unidade.count(),
    ]);
    return { data, count };
  }

  async findOne(id: number): Promise<Unidade | null> {
    const unidade = await this.prisma.unidade.findUnique({
      where: { unid_id: id },
    });
    if (!unidade) {
      throw new NotFoundException(`Unidade with ID "${id}" not found`);
    }
    return unidade;
  }

  async update(
    id: number,
    updateUnidadeDto: UpdateUnidadeDto,
  ): Promise<Unidade> {
    try {
      return await this.prisma.unidade.update({
        where: { unid_id: id },
        data: updateUnidadeDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Unidade with ID "${id}" not found`);
      }
      throw error;
    }
  }
}
