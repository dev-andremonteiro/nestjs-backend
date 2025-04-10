import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServidorTemporarioDto } from './dto/create-servidor-temporario.dto';
import { UpdateServidorTemporarioDto } from './dto/update-servidor-temporario.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ServidorTemporario } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServidorTemporarioService {
  constructor(private prisma: PrismaService) {}

  async create(
    createDto: CreateServidorTemporarioDto,
  ): Promise<ServidorTemporario> {
    try {
      return await this.prisma.servidorTemporario.create({
        data: {
          pes_id: createDto.pes_id,
          st_data_admissao: new Date(createDto.st_data_admissao),
          st_data_demissao: new Date(createDto.st_data_demissao),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'ServidorTemporario with this pes_id already exists.',
          );
        }
        if (error.code === 'P2003') {
          throw new NotFoundException(
            `Pessoa with ID "${createDto.pes_id}" not found.`,
          );
        }
      }
      throw error;
    }
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: ServidorTemporario[]; count: number }> {
    const { skip, take } = paginationQuery;
    const [data, count] = await this.prisma.$transaction([
      this.prisma.servidorTemporario.findMany({ skip, take }),
      this.prisma.servidorTemporario.count(),
    ]);
    return { data, count };
  }

  async findOne(id: number): Promise<ServidorTemporario | null> {
    const servidor = await this.prisma.servidorTemporario.findUnique({
      where: { pes_id: id },
    });
    if (!servidor) {
      throw new NotFoundException(
        `ServidorTemporario with pes_id "${id}" not found`,
      );
    }
    return servidor;
  }

  async update(
    id: number,
    updateDto: UpdateServidorTemporarioDto,
  ): Promise<ServidorTemporario> {
    const dataToUpdate: Prisma.ServidorTemporarioUpdateInput = {};

    if (updateDto.st_data_admissao !== undefined) {
      dataToUpdate.st_data_admissao = new Date(updateDto.st_data_admissao);
    }
    if (updateDto.st_data_demissao !== undefined) {
      dataToUpdate.st_data_demissao = new Date(updateDto.st_data_demissao);
    }

    if (Object.keys(dataToUpdate).length === 0) {
      const existingRecord = await this.findOne(id);
      return existingRecord!;
    }

    try {
      return await this.prisma.servidorTemporario.update({
        where: { pes_id: id },
        data: dataToUpdate,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `ServidorTemporario with pes_id "${id}" not found`,
        );
      }
      throw error;
    }
  }
}
