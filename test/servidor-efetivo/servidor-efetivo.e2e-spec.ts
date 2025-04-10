import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ServidorEfetivo, Pessoa } from '@prisma/client';
import { CreateServidorEfetivoDto } from '../../src/servidor-efetivo/dto/create-servidor-efetivo.dto';
import { UpdateServidorEfetivoDto } from '../../src/servidor-efetivo/dto/update-servidor-efetivo.dto';
import { Sexo } from '../../src/pessoa/dto/create-pessoa.dto';

describe('Servidores Efetivos (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let jwtToken: string;
  let servidorEfetivoCriado: ServidorEfetivo;

  const createTestPessoa = async (nameSuffix: string): Promise<Pessoa> => {
    return prisma.pessoa.create({
      data: {
        pes_nome: `Pessoa Teste Efetivo ${nameSuffix}`,
        pes_data_nascimento: new Date(1990, 5, 15),
        pes_sexo: 'MASCULINO',
        pes_mae: 'Mae Teste',
        pes_pai: 'Pai Teste',
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

    const payload = { username: 'testuser-efetivo', sub: 98 };
    jwtToken = jwtService.sign(payload);

    await prisma.servidorEfetivo.deleteMany({});
    await prisma.pessoa.deleteMany({
      where: { pes_nome: { startsWith: 'Pessoa Teste Efetivo' } },
    });
  });

  afterAll(async () => {
    await prisma.servidorEfetivo.deleteMany({});
    await prisma.pessoa.deleteMany({
      where: { pes_nome: { startsWith: 'Pessoa Teste Efetivo' } },
    });
    await app.close();
  });

  describe('/servidores-efetivos (POST)', () => {
    it('deve rejeitar a criação sem token (401 Unauthorized)', () => {
      const dto: CreateServidorEfetivoDto = {
        pessoa: {
          pes_nome: 'Pessoa Teste Efetivo NoToken',
          pes_data_nascimento: '1990-06-15',
          pes_sexo: Sexo.MASCULINO,
          pes_mae: 'Mae Teste',
          pes_pai: 'Pai Teste',
        },
        se_matricula: 'SEMTOKEN',
      };
      return request(app.getHttpServer())
        .post('/servidores-efetivos')
        .send(dto)
        .expect(401);
    });

    it('deve criar um servidor efetivo com sucesso (201 Created)', async () => {
      const dto: CreateServidorEfetivoDto = {
        pessoa: {
          pes_nome: 'Pessoa Teste Efetivo Create',
          pes_data_nascimento: '1990-06-15',
          pes_sexo: Sexo.MASCULINO,
          pes_mae: 'Mae Teste',
          pes_pai: 'Pai Teste',
        },
        se_matricula: 'MATR001',
      };
      const response = await request(app.getHttpServer())
        .post('/servidores-efetivos')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(201);

      expect(response.body.se_matricula).toEqual(dto.se_matricula);
      expect(response.body.pessoa.pes_nome).toEqual(dto.pessoa.pes_nome);
      servidorEfetivoCriado = response.body;
    });

    it('deve rejeitar a criação com dados inválidos de pessoa (400 Bad Request)', () => {
      const dto: CreateServidorEfetivoDto = {
        pessoa: {
          pes_nome: '', // nome vazio deve ser rejeitado
          pes_data_nascimento: '1990-06-15',
          pes_sexo: Sexo.MASCULINO,
          pes_mae: 'Mae Teste',
          pes_pai: 'Pai Teste',
        },
        se_matricula: 'MATRDUPL',
      };
      return request(app.getHttpServer())
        .post('/servidores-efetivos')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
    });
  });

  describe('/servidores-efetivos (GET)', () => {
    let pessoa1: Pessoa, pessoa2: Pessoa, pessoa3: Pessoa;
    let se1: ServidorEfetivo, se2: ServidorEfetivo, se3: ServidorEfetivo;

    beforeAll(async () => {
      await prisma.servidorEfetivo.deleteMany({});
      await prisma.pessoa.deleteMany({
        where: { pes_nome: { startsWith: 'Pessoa Teste Efetivo' } },
      });
      pessoa1 = await createTestPessoa('Get1');
      pessoa2 = await createTestPessoa('Get2');
      pessoa3 = await createTestPessoa('Get3');
      se1 = await prisma.servidorEfetivo.create({
        data: { pes_id: pessoa1.pes_id, se_matricula: 'GET01' },
      });
      se2 = await prisma.servidorEfetivo.create({
        data: { pes_id: pessoa2.pes_id, se_matricula: 'GET02' },
      });
      se3 = await prisma.servidorEfetivo.create({
        data: { pes_id: pessoa3.pes_id, se_matricula: 'GET03' },
      });
      servidorEfetivoCriado = se1;
    });

    it('deve rejeitar a listagem sem token (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .get('/servidores-efetivos')
        .expect(401);
    });

    it('deve retornar a primeira página de servidores efetivos (200 OK)', async () => {
      const response = await request(app.getHttpServer())
        .get('/servidores-efetivos?page=1&pageSize=2')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(3);
      expect(response.body.data[0].pes_id).toBe(se1.pes_id);
      expect(response.body.data[1].pes_id).toBe(se2.pes_id);
    });

    it('deve retornar a segunda página de servidores efetivos (200 OK)', async () => {
      const response = await request(app.getHttpServer())
        .get('/servidores-efetivos?page=2&pageSize=2')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.count).toBe(3);
      expect(response.body.data[0].pes_id).toBe(se3.pes_id);
    });
  });

  describe('/servidores-efetivos/:id (GET)', () => {
    it('deve rejeitar a busca por ID sem token (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .get(`/servidores-efetivos/${servidorEfetivoCriado.pes_id}`)
        .expect(401);
    });

    it('deve retornar um servidor efetivo específico (200 OK)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/servidores-efetivos/${servidorEfetivoCriado.pes_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
      expect(response.body.pes_id).toBe(servidorEfetivoCriado.pes_id);
      expect(response.body.se_matricula).toBe(
        servidorEfetivoCriado.se_matricula,
      );
    });

    it('deve retornar erro 404 para ID inexistente (404 Not Found)', () => {
      return request(app.getHttpServer())
        .get('/servidores-efetivos/999999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(404);
    });

    it('deve retornar erro 400 para ID inválido (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .get('/servidores-efetivos/invalid')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(400);
    });
  });

  describe('/servidores-efetivos/:id (PUT)', () => {
    it('deve rejeitar a atualização sem token (401 Unauthorized)', () => {
      const dto: UpdateServidorEfetivoDto = { se_matricula: 'UPDATEST' };
      return request(app.getHttpServer())
        .put(`/servidores-efetivos/${servidorEfetivoCriado.pes_id}`)
        .send(dto)
        .expect(401);
    });

    it('deve rejeitar a atualização com ID inválido (400 Bad Request)', () => {
      const dto: UpdateServidorEfetivoDto = { se_matricula: 'UPDATEINV' };
      return request(app.getHttpServer())
        .put('/servidores-efetivos/invalid')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
    });

    it('deve rejeitar a atualização com payload inválido (matrícula muito longa) (400 Bad Request)', async () => {
      const longMatricula = 'M'.repeat(21);
      const dto = { se_matricula: longMatricula };
      await request(app.getHttpServer())
        .put(`/servidores-efetivos/${servidorEfetivoCriado.pes_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
    });

    it('deve retornar erro 404 ao atualizar ID inexistente (404 Not Found)', () => {
      const dto: UpdateServidorEfetivoDto = { se_matricula: 'UPDNF' };
      return request(app.getHttpServer())
        .put('/servidores-efetivos/999999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(404);
    });

    it('deve atualizar a matrícula de um servidor efetivo com sucesso (200 OK)', async () => {
      const dto: UpdateServidorEfetivoDto = {
        se_matricula: 'MATR-UPDATED',
        pessoa: {
          pes_nome: 'Pessoa Teste Efetivo Updated',
          pes_data_nascimento: '1990-06-15',
          pes_sexo: Sexo.MASCULINO,
          pes_mae: 'Mae Teste Updated',
          pes_pai: 'Pai Teste Updated',
        },
      };
      const response = await request(app.getHttpServer())
        .put(`/servidores-efetivos/${servidorEfetivoCriado.pes_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(200);

      expect(response.body.pes_id).toBe(servidorEfetivoCriado.pes_id);
      expect(response.body.se_matricula).toBe(dto.se_matricula);
      expect(response.body.pessoa.pes_nome).toBe(dto.pessoa?.pes_nome);

      const dbCheck = await prisma.servidorEfetivo.findUnique({
        where: { pes_id: servidorEfetivoCriado.pes_id },
        include: { pessoa: true },
      });
      expect(dbCheck?.se_matricula).toBe(dto.se_matricula);
      expect(dbCheck?.pessoa.pes_nome).toBe(dto.pessoa?.pes_nome);
    });
  });
});
