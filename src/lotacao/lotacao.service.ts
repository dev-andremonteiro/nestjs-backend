import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLotacaoDto } from './dto/create-lotacao.dto';
import { UpdateLotacaoDto } from './dto/update-lotacao.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Prisma, Lotacao } from '@prisma/client';

@Injectable()
export class LotacaoService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateLotacaoDto): Promise<Lotacao> {
    try {
      const {
        pes_id,
        pessoa,
        unid_id,
        lot_data_lotacao,
        lot_data_remocao,
        lot_portaria,
      } = createDto;

      if (pes_id && pessoa) {
        throw new BadRequestException(
          'Either pes_id or pessoa must be provided, but not both.',
        );
      }

      const unidadeExists = await this.prisma.unidade.findUnique({
        where: { unid_id },
      });
      if (!unidadeExists) {
        throw new NotFoundException(`Unidade with ID "${unid_id}" not found.`);
      }

      if (pes_id) {
        const pessoaExists = await this.prisma.pessoa.findUnique({
          where: { pes_id },
        });
        if (!pessoaExists) {
          throw new NotFoundException(`Pessoa with ID "${pes_id}" not found.`);
        }

        return await this.prisma.lotacao.create({
          data: {
            pessoa: { connect: { pes_id } },
            unidade: { connect: { unid_id } },
            lot_data_lotacao: new Date(lot_data_lotacao),
            lot_data_remocao: new Date(lot_data_remocao),
            lot_portaria,
          },
          include: {
            pessoa: true,
            unidade: true,
          },
        });
      }

      if (pessoa) {
        const { pes_data_nascimento, ...restPessoaData } = pessoa;

        return await this.prisma.lotacao.create({
          data: {
            unidade: { connect: { unid_id } },
            lot_data_lotacao: new Date(lot_data_lotacao),
            lot_data_remocao: new Date(lot_data_remocao),
            lot_portaria,
            pessoa: {
              create: {
                ...restPessoaData,
                pes_data_nascimento: new Date(pes_data_nascimento),
              },
            },
          },
          include: {
            pessoa: true,
            unidade: true,
          },
        });
      }

      throw new BadRequestException(
        'Either pes_id or pessoa must be provided.',
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A record with this combination already exists.',
          );
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
      this.prisma.lotacao.findMany({
        skip,
        take,
        include: {
          pessoa: true,
          unidade: true,
        },
      }),
      this.prisma.lotacao.count(),
    ]);
    return { data, count };
  }

  async findOne(id: number): Promise<Lotacao | null> {
    const lotacao = await this.prisma.lotacao.findUnique({
      where: { lot_id: id },
      include: {
        pessoa: true,
        unidade: true,
      },
    });
    if (!lotacao) {
      throw new NotFoundException(`Lotacao with ID "${id}" not found`);
    }
    return lotacao;
  }

  async update(id: number, updateDto: UpdateLotacaoDto): Promise<Lotacao> {
    try {
      const { pes_id, pessoa, unid_id, ...otherFields } = updateDto;

      if (pes_id && pessoa) {
        throw new BadRequestException(
          'Cannot update both pes_id and pessoa simultaneously.',
        );
      }

      const existingRecord = await this.findOne(id);
      if (!existingRecord) {
        throw new NotFoundException(`Lotacao with ID "${id}" not found`);
      }

      const dataToUpdate: Prisma.LotacaoUpdateInput = {};

      if (otherFields.lot_data_lotacao !== undefined) {
        dataToUpdate.lot_data_lotacao = new Date(otherFields.lot_data_lotacao);
      }
      if (otherFields.lot_data_remocao !== undefined) {
        dataToUpdate.lot_data_remocao = new Date(otherFields.lot_data_remocao);
      }
      if (otherFields.lot_portaria !== undefined) {
        dataToUpdate.lot_portaria = otherFields.lot_portaria;
      }

      if (pes_id) {
        const pessoaExists = await this.prisma.pessoa.findUnique({
          where: { pes_id },
        });
        if (!pessoaExists) {
          throw new NotFoundException(`Pessoa with ID "${pes_id}" not found.`);
        }
        dataToUpdate.pessoa = { connect: { pes_id } };
      } else if (pessoa) {
        const { pes_data_nascimento, ...restPessoaData } = pessoa;
        dataToUpdate.pessoa = {
          update: {
            ...restPessoaData,
            ...(pes_data_nascimento && {
              pes_data_nascimento: new Date(pes_data_nascimento),
            }),
          },
        };
      }

      if (unid_id) {
        const unidadeExists = await this.prisma.unidade.findUnique({
          where: { unid_id },
        });
        if (!unidadeExists) {
          throw new NotFoundException(
            `Unidade with ID "${unid_id}" not found.`,
          );
        }
        dataToUpdate.unidade = { connect: { unid_id } };
      }

      if (Object.keys(dataToUpdate).length === 0) {
        return existingRecord;
      }

      return await this.prisma.lotacao.update({
        where: { lot_id: id },
        data: dataToUpdate,
        include: {
          pessoa: true,
          unidade: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Lotacao with ID "${id}" not found`);
      }
      throw error;
    }
  }
}
