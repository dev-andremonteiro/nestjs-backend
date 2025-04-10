import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServidorEfetivoDto } from './dto/create-servidor-efetivo.dto';
import { UpdateServidorEfetivoDto } from './dto/update-servidor-efetivo.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Prisma, ServidorEfetivo } from '@prisma/client';

@Injectable()
export class ServidorEfetivoService {
  constructor(private prisma: PrismaService) {}

  async create(
    createServidorEfetivoDto: CreateServidorEfetivoDto,
  ): Promise<ServidorEfetivo> {
    try {
      const { pessoa, ...servidorData } = createServidorEfetivoDto;
      const { pes_data_nascimento, ...restPessoaData } = pessoa;

      return await this.prisma.servidorEfetivo.create({
        data: {
          ...servidorData,
          pessoa: {
            create: {
              ...restPessoaData,
              pes_data_nascimento: new Date(pes_data_nascimento),
            },
          },
        },
        include: {
          pessoa: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'ServidorEfetivo with this pessoa already exists.',
          );
        }
      }
      throw error;
    }
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: ServidorEfetivo[]; count: number }> {
    const { skip, take } = paginationQuery;
    const [data, count] = await this.prisma.$transaction([
      this.prisma.servidorEfetivo.findMany({ skip, take }),
      this.prisma.servidorEfetivo.count(),
    ]);
    return { data, count };
  }

  async findOne(id: number): Promise<ServidorEfetivo | null> {
    const servidor = await this.prisma.servidorEfetivo.findUnique({
      where: { pes_id: id },
    });
    if (!servidor) {
      throw new NotFoundException(
        `ServidorEfetivo with pes_id "${id}" not found`,
      );
    }
    return servidor;
  }

  async update(
    id: number,
    updateServidorEfetivoDto: UpdateServidorEfetivoDto,
  ): Promise<ServidorEfetivo> {
    try {
      const { pessoa, ...servidorData } = updateServidorEfetivoDto;

      let pessoaUpdateData: Prisma.PessoaUpdateInput | undefined;
      if (pessoa) {
        const { pes_data_nascimento, ...restPessoaData } = pessoa;
        pessoaUpdateData = {
          ...restPessoaData,
          ...(pes_data_nascimento && {
            pes_data_nascimento: new Date(pes_data_nascimento),
          }),
        };
      }

      return await this.prisma.servidorEfetivo.update({
        where: { pes_id: id },
        data: {
          ...servidorData,
          ...(pessoaUpdateData && {
            pessoa: {
              update: pessoaUpdateData,
            },
          }),
        },
        include: {
          pessoa: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `ServidorEfetivo with pes_id "${id}" not found`,
        );
      }
      throw error;
    }
  }
}
