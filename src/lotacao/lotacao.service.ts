import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLotacaoDto } from './dto/create-lotacao.dto';
import { UpdateLotacaoDto } from './dto/update-lotacao.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Lotacao } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class LotacaoService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateLotacaoDto): Promise<Lotacao> {
    try {
      return await this.prisma.lotacao.create({
        data: {
          ...createDto,
          lot_data_lotacao: new Date(createDto.lot_data_lotacao),
          lot_data_remocao: new Date(createDto.lot_data_remocao),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          const field = error.meta?.field_name;
          if (field === 'Lotacao_pes_id_fkey (index)') {
            throw new NotFoundException(
              `Pessoa with ID "${createDto.pes_id}" not found.`,
            );
          }
          if (field === 'Lotacao_unid_id_fkey (index)') {
            throw new NotFoundException(
              `Unidade with ID "${createDto.unid_id}" not found.`,
            );
          }
          throw new NotFoundException('Related Pessoa or Unidade not found.');
        }
      }
      throw error;
    }
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: Lotacao[]; count: number }> {
    const { skip, take } = paginationQuery;
    const [data, count] = await this.prisma.$transaction([
      this.prisma.lotacao.findMany({ skip, take }),
      this.prisma.lotacao.count(),
    ]);
    return { data, count };
  }

  async findOne(id: number): Promise<Lotacao | null> {
    const lotacao = await this.prisma.lotacao.findUnique({
      where: { lot_id: id },
    });
    if (!lotacao) {
      throw new NotFoundException(`Lotacao with ID "${id}" not found`);
    }
    return lotacao;
  }

  async update(id: number, updateDto: UpdateLotacaoDto): Promise<Lotacao> {
    const dataToUpdate: Prisma.LotacaoUpdateInput = {};

    if (updateDto.pes_id !== undefined)
      dataToUpdate.pessoa = { connect: { pes_id: updateDto.pes_id } };
    if (updateDto.unid_id !== undefined)
      dataToUpdate.unidade = { connect: { unid_id: updateDto.unid_id } };
    if (updateDto.lot_data_lotacao !== undefined)
      dataToUpdate.lot_data_lotacao = new Date(updateDto.lot_data_lotacao);
    if (updateDto.lot_data_remocao !== undefined)
      dataToUpdate.lot_data_remocao = new Date(updateDto.lot_data_remocao);
    if (updateDto.lot_portaria !== undefined)
      dataToUpdate.lot_portaria = updateDto.lot_portaria;

    if (Object.keys(dataToUpdate).length === 0) {
      const existingRecord = await this.findOne(id);
      return existingRecord!;
    }

    try {
      await this.findOne(id);

      if (updateDto.pes_id) {
        const pessoaExists = await this.prisma.pessoa.findUnique({
          where: { pes_id: updateDto.pes_id },
        });
        if (!pessoaExists)
          throw new NotFoundException(
            `Pessoa with ID "${updateDto.pes_id}" not found.`,
          );
      }
      if (updateDto.unid_id) {
        const unidadeExists = await this.prisma.unidade.findUnique({
          where: { unid_id: updateDto.unid_id },
        });
        if (!unidadeExists)
          throw new NotFoundException(
            `Unidade with ID "${updateDto.unid_id}" not found.`,
          );
      }

      return await this.prisma.lotacao.update({
        where: { lot_id: id },
        data: dataToUpdate,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Lotacao with ID "${id}" not found`);
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }
}
