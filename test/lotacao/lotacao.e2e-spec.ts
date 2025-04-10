import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Lotacao, Pessoa, Unidade } from '@prisma/client';
import { CreateLotacaoDto } from '../../src/lotacao/dto/create-lotacao.dto';
import { UpdateLotacaoDto } from '../../src/lotacao/dto/update-lotacao.dto';

describe('Lotações (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let jwtToken: string;

  const createTestPessoa = async (nameSuffix: string): Promise<Pessoa> => {
    return prisma.pessoa.create({
      data: {
        pes_nome: `Pessoa Teste Lotacao ${nameSuffix}`,
        pes_data_nascimento: new Date(1995, 1, 1),
        pes_sexo: 'Outro',
        pes_mae: 'Mae Teste Lot',
        pes_pai: 'Pai Teste Lot',
      },
    });
  };

  const createTestUnidade = async (nameSuffix: string): Promise<Unidade> => {
    return prisma.unidade.create({
      data: {
        unid_nome: `Unidade Teste Lotacao ${nameSuffix}`,
        unid_sigla: `UTL${nameSuffix.substring(0, 3).toUpperCase()}`,
      },
    });
  };

  const createTestLotacao = async (
    pessoaId: number,
    unidadeId: number,
    portaria: string,
  ): Promise<Lotacao> => {
    return prisma.lotacao.create({
      data: {
        pes_id: pessoaId,
        unid_id: unidadeId,
        lot_data_lotacao: new Date(),
        lot_data_remocao: new Date(),
        lot_portaria: portaria,
      },
    });
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    const payload = { username: 'testuser-lotacao', sub: 96 };
    jwtToken = jwtService.sign(payload);
  });

  afterAll(async () => {
    await prisma.lotacao.deleteMany({});
    await prisma.servidorEfetivo.deleteMany({});
    await prisma.servidorTemporario.deleteMany({});
    await prisma.pessoa.deleteMany({
      where: { pes_nome: { startsWith: 'Pessoa Teste' } },
    });
    await prisma.unidade.deleteMany({
      where: { unid_nome: { startsWith: 'Unidade Teste' } },
    });
    await app.close();
  });

  describe('/lotacoes (POST)', () => {
    let pessoa: Pessoa;
    let unidade: Unidade;
    const baseDto: Omit<CreateLotacaoDto, 'pes_id' | 'unid_id'> = {
      lot_data_lotacao: '2023-01-01',
      lot_data_remocao: '2023-12-31',
      lot_portaria: 'Portaria POST/2023',
    };

    beforeAll(async () => {
      pessoa = await createTestPessoa('Post');
      unidade = await createTestUnidade('Post');
    });

    afterAll(async () => {});

    it('deve rejeitar a criação sem token (401 Unauthorized)', () => {
      const dto = {
        ...baseDto,
        pes_id: pessoa.pes_id,
        unid_id: unidade.unid_id,
      };
      return request(app.getHttpServer())
        .post('/lotacoes')
        .send(dto)
        .expect(401);
    });

    it('deve rejeitar a criação se Pessoa não existe (404 Not Found)', () => {
      const dto = { ...baseDto, pes_id: 999999, unid_id: unidade.unid_id };
      return request(app.getHttpServer())
        .post('/lotacoes')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(404);
    });

    it('deve rejeitar a criação se Unidade não existe (404 Not Found)', () => {
      const dto = { ...baseDto, pes_id: pessoa.pes_id, unid_id: 999999 };
      return request(app.getHttpServer())
        .post('/lotacoes')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(404);
    });

    it('deve rejeitar a criação com data inválida (400 Bad Request)', () => {
      const dto = {
        ...baseDto,
        pes_id: pessoa.pes_id,
        unid_id: unidade.unid_id,
        lot_data_lotacao: 'invalid-date',
      };
      return request(app.getHttpServer())
        .post('/lotacoes')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
    });

    it('deve criar uma lotação com sucesso (201 Created)', async () => {
      const dto = {
        ...baseDto,
        pes_id: pessoa.pes_id,
        unid_id: unidade.unid_id,
      };
      const response = await request(app.getHttpServer())
        .post('/lotacoes')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(201);

      expect(response.body).toHaveProperty('lot_id');
      expect(response.body.pes_id).toEqual(dto.pes_id);
      expect(response.body.unid_id).toEqual(dto.unid_id);
      expect(new Date(response.body.lot_data_lotacao)).toEqual(
        new Date(dto.lot_data_lotacao),
      );
      expect(new Date(response.body.lot_data_remocao)).toEqual(
        new Date(dto.lot_data_remocao),
      );
      expect(response.body.lot_portaria).toEqual(dto.lot_portaria);

      await prisma.lotacao.delete({ where: { lot_id: response.body.lot_id } });
    });
  });

  describe('/lotacoes (GET)', () => {
    let p1: Pessoa, p2: Pessoa, p3: Pessoa;
    let u1: Unidade, u2: Unidade;
    let l1: Lotacao, l2: Lotacao, l3: Lotacao;

    beforeAll(async () => {
      await prisma.lotacao.deleteMany({});
      p1 = await createTestPessoa('Get1');
      p2 = await createTestPessoa('Get2');
      p3 = await createTestPessoa('Get3');
      u1 = await createTestUnidade('GetA');
      u2 = await createTestUnidade('GetB');

      l1 = await createTestLotacao(p1.pes_id, u1.unid_id, 'GET_P01');
      l2 = await createTestLotacao(p2.pes_id, u1.unid_id, 'GET_P02');
      l3 = await createTestLotacao(p3.pes_id, u2.unid_id, 'GET_P03');
    });

    it('deve rejeitar a listagem sem token (401 Unauthorized)', () => {
      return request(app.getHttpServer()).get('/lotacoes').expect(401);
    });

    it('deve retornar a primeira página de lotações (200 OK)', async () => {
      const response = await request(app.getHttpServer())
        .get('/lotacoes?page=1&pageSize=2')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(3);
      expect(response.body.data.map((l: Lotacao) => l.lot_id)).toEqual(
        expect.arrayContaining([l1.lot_id, l2.lot_id]),
      );
    });

    it('deve retornar a segunda página de lotações (200 OK)', async () => {
      const response = await request(app.getHttpServer())
        .get('/lotacoes?page=2&pageSize=2')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.count).toBe(3);
      expect(response.body.data[0].lot_id).toBe(l3.lot_id);
    });
  });

  describe('/lotacoes/:id (GET)', () => {
    let testLotacao: Lotacao;

    beforeAll(async () => {
      const p = await createTestPessoa('GetById');
      const u = await createTestUnidade('GetById');
      testLotacao = await createTestLotacao(p.pes_id, u.unid_id, 'GET_ID_P');
    });

    it('deve rejeitar a busca por ID sem token (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .get(`/lotacoes/${testLotacao.lot_id}`)
        .expect(401);
    });

    it('deve retornar uma lotação específica (200 OK)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/lotacoes/${testLotacao.lot_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
      expect(response.body.lot_id).toBe(testLotacao.lot_id);
      expect(response.body.pes_id).toBe(testLotacao.pes_id);
    });

    it('deve retornar erro 404 para ID inexistente (404 Not Found)', () => {
      return request(app.getHttpServer())
        .get('/lotacoes/999999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(404);
    });

    it('deve retornar erro 400 para ID inválido (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .get('/lotacoes/invalid')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(400);
    });
  });

  describe('/lotacoes/:id (PUT)', () => {
    let pessoaForPut: Pessoa;
    let unidadeForPut: Unidade;
    let lotacaoToUpdate: Lotacao;
    let pessoaUpdateTarget: Pessoa;
    let unidadeUpdateTarget: Unidade;

    beforeAll(async () => {
      pessoaForPut = await createTestPessoa('PutSetup');
      unidadeForPut = await createTestUnidade('PutSetup');
      lotacaoToUpdate = await createTestLotacao(
        pessoaForPut.pes_id,
        unidadeForPut.unid_id,
        'PUT_Initial',
      );
      pessoaUpdateTarget = await createTestPessoa('PutTarget');
      unidadeUpdateTarget = await createTestUnidade('PutTarget');
    });

    it('deve rejeitar a atualização sem token (401 Unauthorized)', () => {
      const dto: UpdateLotacaoDto = { lot_portaria: 'Update Sem Token' };
      return request(app.getHttpServer())
        .put(`/lotacoes/${lotacaoToUpdate.lot_id}`)
        .send(dto)
        .expect(401);
    });

    it('deve rejeitar a atualização com ID inválido (400 Bad Request)', () => {
      const dto: UpdateLotacaoDto = { lot_portaria: 'Update Inválido' };
      return request(app.getHttpServer())
        .put('/lotacoes/invalid')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
    });

    it('deve rejeitar a atualização com data inválida (400 Bad Request)', () => {
      const dto = { lot_data_lotacao: 'invalid' };
      return request(app.getHttpServer())
        .put(`/lotacoes/${lotacaoToUpdate.lot_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
    });

    it('deve rejeitar a atualização se Pessoa não existe (404 Not Found)', () => {
      const dto: UpdateLotacaoDto = { pes_id: 999999 };
      return request(app.getHttpServer())
        .put(`/lotacoes/${lotacaoToUpdate.lot_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(404);
    });

    it('deve rejeitar a atualização se Unidade não existe (404 Not Found)', () => {
      const dto: UpdateLotacaoDto = { unid_id: 999999 };
      return request(app.getHttpServer())
        .put(`/lotacoes/${lotacaoToUpdate.lot_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(404);
    });

    it('deve retornar 404 ao tentar atualizar ID de Lotação inexistente (404 Not Found)', () => {
      const dto: UpdateLotacaoDto = { lot_portaria: 'NF-Lotacao' };
      return request(app.getHttpServer())
        .put('/lotacoes/999999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(404);
    });

    it('deve atualizar uma lotação com sucesso (200 OK)', async () => {
      const dto: UpdateLotacaoDto = {
        pes_id: pessoaUpdateTarget.pes_id,
        unid_id: unidadeUpdateTarget.unid_id,
        lot_data_lotacao: '2025-01-01',
        lot_data_remocao: '2025-12-31',
        lot_portaria: 'Portaria PUT Success',
      };

      const response = await request(app.getHttpServer())
        .put(`/lotacoes/${lotacaoToUpdate.lot_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(200);

      expect(response.body.lot_id).toBe(lotacaoToUpdate.lot_id);
      expect(response.body.pes_id).toBe(dto.pes_id);
      expect(response.body.unid_id).toBe(dto.unid_id);
      expect(new Date(response.body.lot_data_lotacao)).toEqual(
        new Date(dto.lot_data_lotacao!),
      );
      expect(new Date(response.body.lot_data_remocao)).toEqual(
        new Date(dto.lot_data_remocao!),
      );
      expect(response.body.lot_portaria).toBe(dto.lot_portaria);

      const dbCheck = await prisma.lotacao.findUnique({
        where: { lot_id: lotacaoToUpdate.lot_id },
      });
      expect(dbCheck?.pes_id).toBe(dto.pes_id);
      expect(dbCheck?.unid_id).toBe(dto.unid_id);
      expect(dbCheck?.lot_data_lotacao).toEqual(
        new Date(dto.lot_data_lotacao!),
      );
      expect(dbCheck?.lot_data_remocao).toEqual(
        new Date(dto.lot_data_remocao!),
      );
      expect(dbCheck?.lot_portaria).toBe(dto.lot_portaria);
    });

    it('deve retornar o registro existente se nenhum dado for enviado para atualização (200 OK)', async () => {
      const dto = {};
      const response = await request(app.getHttpServer())
        .put(`/lotacoes/${lotacaoToUpdate.lot_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(200);

      expect(response.body.pes_id).toBe(pessoaUpdateTarget.pes_id);
      expect(response.body.unid_id).toBe(unidadeUpdateTarget.unid_id);
      expect(new Date(response.body.lot_data_lotacao)).toEqual(
        new Date('2025-01-01'),
      );
      expect(response.body.lot_portaria).toBe('Portaria PUT Success');
    });
  });
});
