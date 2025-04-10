import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServidorTemporarioDto } from './dto/create-servidor-temporario.dto';
import { UpdateServidorTemporarioDto } from './dto/update-servidor-temporario.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Prisma, ServidorTemporario } from '@prisma/client';

@Injectable()
export class ServidorTemporarioService {
  constructor(private prisma: PrismaService) {}

  async create(
    createDto: CreateServidorTemporarioDto,
  ): Promise<ServidorTemporario> {
    try {
      const { pessoa, ...servidorData } = createDto;
      const { pes_data_nascimento, ...restPessoaData } = pessoa;

      return await this.prisma.servidorTemporario.create({
        data: {
          st_data_admissao: new Date(servidorData.st_data_admissao),
          st_data_demissao: new Date(servidorData.st_data_demissao),
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
            'ServidorTemporario with this pessoa already exists.',
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
    try {
      const { pessoa, ...servidorData } = updateDto;
      const dataToUpdate: Prisma.ServidorTemporarioUpdateInput = {};

      if (servidorData.st_data_admissao !== undefined) {
        dataToUpdate.st_data_admissao = new Date(servidorData.st_data_admissao);
      }
      if (servidorData.st_data_demissao !== undefined) {
        dataToUpdate.st_data_demissao = new Date(servidorData.st_data_demissao);
      }

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

      return await this.prisma.servidorTemporario.update({
        where: { pes_id: id },
        data: {
          ...dataToUpdate,
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
          `ServidorTemporario with pes_id "${id}" not found`,
        );
      }
      throw error;
    }
  }
}
