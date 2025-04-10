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
import { Sexo } from '../../src/pessoa/dto/create-pessoa.dto';

describe('Lotações (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let jwtToken: string;

  const createTestPessoa = async (nameSuffix: string): Promise<Pessoa> => {
    return prisma.pessoa.create({
      data: {
        pes_nome: `Pessoa Teste Lotacao ${nameSuffix}`,
        pes_data_nascimento: new Date('1995-02-01T00:00:00.000Z'),
        pes_sexo: 'MASCULINO',
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
        lot_data_lotacao: new Date('2023-01-01T00:00:00.000Z'),
        lot_data_remocao: new Date('2023-12-31T00:00:00.000Z'),
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
    const baseDto: Omit<CreateLotacaoDto, 'pes_id' | 'unid_id' | 'pessoa'> = {
      lot_data_lotacao: '2023-01-01T00:00:00.000Z',
      lot_data_remocao: '2023-12-31T00:00:00.000Z',
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

    it('deve criar uma lotação com pes_id existente (201 Created)', async () => {
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

    it('deve criar uma lotação com pessoa aninhada (201 Created)', async () => {
      const dto = {
        ...baseDto,
        pessoa: {
          pes_nome: 'Pessoa Teste Lotacao Aninhada',
          pes_data_nascimento: '1995-02-01T00:00:00.000Z',
          pes_sexo: Sexo.MASCULINO,
          pes_mae: 'Mae Teste Lot Aninhada',
          pes_pai: 'Pai Teste Lot Aninhado',
        },
        unid_id: unidade.unid_id,
      };
      const response = await request(app.getHttpServer())
        .post('/lotacoes')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(201);

      expect(response.body).toHaveProperty('lot_id');
      expect(response.body).toHaveProperty('pes_id');
      expect(response.body.unid_id).toEqual(dto.unid_id);
      expect(response.body.pessoa.pes_nome).toEqual(dto.pessoa.pes_nome);
      expect(new Date(response.body.lot_data_lotacao)).toEqual(
        new Date(dto.lot_data_lotacao),
      );
      expect(new Date(response.body.lot_data_remocao)).toEqual(
        new Date(dto.lot_data_remocao),
      );
      expect(response.body.lot_portaria).toEqual(dto.lot_portaria);

      await prisma.lotacao.delete({ where: { lot_id: response.body.lot_id } });
    });

    it('deve rejeitar a criação com pes_id e pessoa simultaneamente (400 Bad Request)', () => {
      const dto = {
        ...baseDto,
        pes_id: pessoa.pes_id,
        pessoa: {
          pes_nome: 'Pessoa Teste Lotacao Ambos',
          pes_data_nascimento: '1995-02-01T00:00:00.000Z',
          pes_sexo: Sexo.MASCULINO,
          pes_mae: 'Mae Teste Lot',
          pes_pai: 'Pai Teste Lot',
        },
        unid_id: unidade.unid_id,
      };
      return request(app.getHttpServer())
        .post('/lotacoes')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
    });

    it('deve rejeitar a criação sem pes_id ou pessoa (400 Bad Request)', () => {
      const dto = {
        ...baseDto,
        unid_id: unidade.unid_id,
      };
      return request(app.getHttpServer())
        .post('/lotacoes')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
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
      expect(response.body.data[0].lot_id).toBe(l1.lot_id);
      expect(response.body.data[1].lot_id).toBe(l2.lot_id);

      // Check if pessoa and unidade are included
      expect(response.body.data[0].pessoa).toBeDefined();
      expect(response.body.data[0].unidade).toBeDefined();
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
    let pessoa: Pessoa;
    let unidade: Unidade;
    let lotacao: Lotacao;

    beforeAll(async () => {
      pessoa = await createTestPessoa('GetOne');
      unidade = await createTestUnidade('GetOne');
      lotacao = await createTestLotacao(
        pessoa.pes_id,
        unidade.unid_id,
        'GET_ONE',
      );
    });

    it('deve rejeitar a busca por ID sem token (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .get(`/lotacoes/${lotacao.lot_id}`)
        .expect(401);
    });

    it('deve retornar uma lotação específica (200 OK)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/lotacoes/${lotacao.lot_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body.lot_id).toBe(lotacao.lot_id);
      expect(response.body.pes_id).toBe(pessoa.pes_id);
      expect(response.body.unid_id).toBe(unidade.unid_id);

      // Check if pessoa and unidade are included
      expect(response.body.pessoa).toBeDefined();
      expect(response.body.unidade).toBeDefined();
      expect(response.body.pessoa.pes_nome).toBe(pessoa.pes_nome);
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
    let pessoa: Pessoa;
    let newPessoa: Pessoa;
    let unidade: Unidade;
    let newUnidade: Unidade;
    let lotacao: Lotacao;

    beforeAll(async () => {
      pessoa = await createTestPessoa('PutOriginal');
      newPessoa = await createTestPessoa('PutNew');
      unidade = await createTestUnidade('PutOriginal');
      newUnidade = await createTestUnidade('PutNew');
      lotacao = await createTestLotacao(
        pessoa.pes_id,
        unidade.unid_id,
        'PUT_ORIG',
      );
    });

    it('deve rejeitar a atualização sem token (401 Unauthorized)', () => {
      const dto: UpdateLotacaoDto = {
        lot_portaria: 'Portaria PUT/2023',
      };
      return request(app.getHttpServer())
        .put(`/lotacoes/${lotacao.lot_id}`)
        .send(dto)
        .expect(401);
    });

    it('deve rejeitar a atualização com ID inválido (400 Bad Request)', () => {
      const dto: UpdateLotacaoDto = {
        lot_portaria: 'Portaria PUT/2023',
      };
      return request(app.getHttpServer())
        .put('/lotacoes/invalid')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
    });

    it('deve rejeitar a atualização com data inválida (400 Bad Request)', async () => {
      const dto = { lot_data_lotacao: 'invalid-date' };
      await request(app.getHttpServer())
        .put(`/lotacoes/${lotacao.lot_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
    });

    it('deve retornar erro 404 ao atualizar ID inexistente (404 Not Found)', () => {
      const dto: UpdateLotacaoDto = {
        lot_portaria: 'Portaria PUT/2023',
      };
      return request(app.getHttpServer())
        .put('/lotacoes/999999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(404);
    });

    it('deve atualizar uma lotação com sucesso (200 OK)', async () => {
      const dto: UpdateLotacaoDto = {
        pes_id: newPessoa.pes_id,
        unid_id: newUnidade.unid_id,
        lot_data_lotacao: '2023-05-01T00:00:00.000Z',
        lot_data_remocao: '2023-10-01T00:00:00.000Z',
        lot_portaria: 'Portaria PUT/2023 Updated',
      };

      const response = await request(app.getHttpServer())
        .put(`/lotacoes/${lotacao.lot_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(200);

      expect(response.body.lot_id).toBe(lotacao.lot_id);
      expect(response.body.pes_id).toBe(dto.pes_id);
      expect(response.body.unid_id).toBe(dto.unid_id);
      expect(new Date(response.body.lot_data_lotacao)).toEqual(
        new Date(dto.lot_data_lotacao!),
      );
      expect(new Date(response.body.lot_data_remocao)).toEqual(
        new Date(dto.lot_data_remocao!),
      );
      expect(response.body.lot_portaria).toBe(dto.lot_portaria);
    });

    it('deve atualizar os dados da pessoa aninhada com sucesso (200 OK)', async () => {
      // Create a new lotacao for this test
      const testPessoa = await createTestPessoa('PutNested');
      const testUnidade = await createTestUnidade('PutNested');
      const testLotacao = await createTestLotacao(
        testPessoa.pes_id,
        testUnidade.unid_id,
        'PUT_NESTED',
      );

      const dto: UpdateLotacaoDto = {
        lot_portaria: 'Portaria PUT NESTED',
        pessoa: {
          pes_nome: 'Pessoa Teste Lotacao PutNestedUpdate',
          pes_data_nascimento: '1995-03-15T00:00:00.000Z',
          pes_sexo: Sexo.MASCULINO,
          pes_mae: 'Mae Teste Lot Updated',
          pes_pai: 'Pai Teste Lot Updated',
        },
      };

      const response = await request(app.getHttpServer())
        .put(`/lotacoes/${testLotacao.lot_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(200);

      expect(response.body.lot_id).toBe(testLotacao.lot_id);
      expect(response.body.lot_portaria).toBe(dto.lot_portaria);
      expect(response.body.pessoa.pes_nome).toBe(dto.pessoa?.pes_nome);
      expect(response.body.pessoa.pes_mae).toBe(dto.pessoa?.pes_mae);

      // Verify the database was updated
      const dbCheck = await prisma.lotacao.findUnique({
        where: { lot_id: testLotacao.lot_id },
        include: { pessoa: true },
      });
      expect(dbCheck?.pessoa.pes_nome).toBe(dto.pessoa?.pes_nome);
    });

    it('deve rejeitar a atualização com pes_id e pessoa simultaneamente (400 Bad Request)', () => {
      const dto: UpdateLotacaoDto = {
        pes_id: newPessoa.pes_id,
        pessoa: {
          pes_nome: 'Pessoa Teste Lotacao Both Update',
          pes_data_nascimento: '1995-02-01T00:00:00.000Z',
          pes_sexo: Sexo.MASCULINO,
          pes_mae: 'Mae Teste',
          pes_pai: 'Pai Teste',
        },
      };
      return request(app.getHttpServer())
        .put(`/lotacoes/${lotacao.lot_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
    });
  });
});
