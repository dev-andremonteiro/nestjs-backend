import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ServidorTemporario, Pessoa } from '@prisma/client';
import { CreateServidorTemporarioDto } from '../../src/servidor-temporario/dto/create-servidor-temporario.dto';
import { UpdateServidorTemporarioDto } from '../../src/servidor-temporario/dto/update-servidor-temporario.dto';

describe('Servidores Temporários (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let jwtToken: string;
  let pessoaTeste: Pessoa;
  let servidorTempCriado: ServidorTemporario;

  const createTestPessoa = async (nameSuffix: string): Promise<Pessoa> => {
    return prisma.pessoa.create({
      data: {
        pes_nome: `Pessoa Teste Temp ${nameSuffix}`,
        pes_data_nascimento: new Date(1991, 7, 20),
        pes_sexo: 'Outro',
        pes_mae: 'Mae Teste Temp',
        pes_pai: 'Pai Teste Temp',
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

    const payload = { username: 'testuser-temporario', sub: 97 };
    jwtToken = jwtService.sign(payload);

    await prisma.servidorTemporario.deleteMany({});
    await prisma.pessoa.deleteMany({
      where: { pes_nome: { startsWith: 'Pessoa Teste Temp' } },
    });
    pessoaTeste = await createTestPessoa('Base');
  });

  afterAll(async () => {
    await prisma.servidorTemporario.deleteMany({});
    await prisma.pessoa.deleteMany({
      where: { pes_nome: { startsWith: 'Pessoa Teste Temp' } },
    });
    await app.close();
  });

  describe('/servidores-temporarios (POST)', () => {
    it('deve rejeitar a criação sem token (401 Unauthorized)', () => {
      const dto: CreateServidorTemporarioDto = {
        pes_id: pessoaTeste.pes_id,
        st_data_admissao: '2023-01-01',
        st_data_demissao: '2023-12-31',
      };
      return request(app.getHttpServer())
        .post('/servidores-temporarios')
        .send(dto)
        .expect(401);
    });

    it('deve rejeitar a criação se Pessoa não existe (404 Not Found)', () => {
      const dto: CreateServidorTemporarioDto = {
        pes_id: 999999,
        st_data_admissao: '2023-01-01',
        st_data_demissao: '2023-12-31',
      };
      return request(app.getHttpServer())
        .post('/servidores-temporarios')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(404);
    });

    it('deve rejeitar a criação com data inválida (400 Bad Request)', () => {
      const dto = {
        pes_id: pessoaTeste.pes_id,
        st_data_admissao: 'data-invalida',
        st_data_demissao: '2023-12-31',
      };
      return request(app.getHttpServer())
        .post('/servidores-temporarios')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
    });

    it('deve criar um servidor temporário com sucesso (201 Created)', async () => {
      const dto: CreateServidorTemporarioDto = {
        pes_id: pessoaTeste.pes_id,
        st_data_admissao: '2023-02-15',
        st_data_demissao: '2024-02-14',
      };
      const response = await request(app.getHttpServer())
        .post('/servidores-temporarios')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(201);

      expect(response.body.pes_id).toEqual(dto.pes_id);
      expect(new Date(response.body.st_data_admissao)).toEqual(
        new Date(dto.st_data_admissao),
      );
      expect(new Date(response.body.st_data_demissao)).toEqual(
        new Date(dto.st_data_demissao),
      );
      servidorTempCriado = response.body;
    });

    it('deve rejeitar a criação se pes_id já existe (409 Conflict)', () => {
      const dto: CreateServidorTemporarioDto = {
        pes_id: pessoaTeste.pes_id,
        st_data_admissao: '2024-01-01',
        st_data_demissao: '2024-12-31',
      };
      return request(app.getHttpServer())
        .post('/servidores-temporarios')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(409);
    });
  });

  describe('/servidores-temporarios (GET)', () => {
    let p1: Pessoa, p2: Pessoa, p3: Pessoa;
    let st1: ServidorTemporario,
      st2: ServidorTemporario,
      st3: ServidorTemporario;

    beforeAll(async () => {
      await prisma.servidorTemporario.deleteMany({});
      await prisma.pessoa.deleteMany({
        where: { pes_nome: { startsWith: 'Pessoa Teste Temp' } },
      });
      p1 = await createTestPessoa('Get1');
      p2 = await createTestPessoa('Get2');
      p3 = await createTestPessoa('Get3');
      st1 = await prisma.servidorTemporario.create({
        data: {
          pes_id: p1.pes_id,
          st_data_admissao: new Date(2022, 0, 1),
          st_data_demissao: new Date(2022, 11, 31),
        },
      });
      st2 = await prisma.servidorTemporario.create({
        data: {
          pes_id: p2.pes_id,
          st_data_admissao: new Date(2023, 0, 1),
          st_data_demissao: new Date(2023, 11, 31),
        },
      });
      st3 = await prisma.servidorTemporario.create({
        data: {
          pes_id: p3.pes_id,
          st_data_admissao: new Date(2024, 0, 1),
          st_data_demissao: new Date(2024, 11, 31),
        },
      });
      servidorTempCriado = st1;
    });

    it('deve rejeitar a listagem sem token (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .get('/servidores-temporarios')
        .expect(401);
    });

    it('deve retornar a primeira página de servidores temporários (200 OK)', async () => {
      const response = await request(app.getHttpServer())
        .get('/servidores-temporarios?page=1&pageSize=2')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(3);
      expect(response.body.data[0].pes_id).toBe(st1.pes_id);
      expect(response.body.data[1].pes_id).toBe(st2.pes_id);
    });

    it('deve retornar a segunda página de servidores temporários (200 OK)', async () => {
      const response = await request(app.getHttpServer())
        .get('/servidores-temporarios?page=2&pageSize=2')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.count).toBe(3);
      expect(response.body.data[0].pes_id).toBe(st3.pes_id);
    });
  });

  describe('/servidores-temporarios/:id (GET)', () => {
    it('deve rejeitar a busca por ID sem token (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .get(`/servidores-temporarios/${servidorTempCriado.pes_id}`)
        .expect(401);
    });

    it('deve retornar um servidor temporário específico (200 OK)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/servidores-temporarios/${servidorTempCriado.pes_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
      expect(response.body.pes_id).toBe(servidorTempCriado.pes_id);
    });

    it('deve retornar erro 404 para ID inexistente (404 Not Found)', () => {
      return request(app.getHttpServer())
        .get('/servidores-temporarios/999999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(404);
    });

    it('deve retornar erro 400 para ID inválido (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .get('/servidores-temporarios/invalid')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(400);
    });
  });

  describe('/servidores-temporarios/:id (PUT)', () => {
    it('deve rejeitar a atualização sem token (401 Unauthorized)', () => {
      const dto: UpdateServidorTemporarioDto = {
        st_data_demissao: '2025-01-01',
      };
      return request(app.getHttpServer())
        .put(`/servidores-temporarios/${servidorTempCriado.pes_id}`)
        .send(dto)
        .expect(401);
    });

    it('deve rejeitar a atualização com ID inválido (400 Bad Request)', () => {
      const dto: UpdateServidorTemporarioDto = {
        st_data_demissao: '2025-01-01',
      };
      return request(app.getHttpServer())
        .put('/servidores-temporarios/invalid')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
    });

    it('deve rejeitar a atualização com payload inválido (data inválida) (400 Bad Request)', async () => {
      const dto = { st_data_admissao: 'not-a-date' };
      await request(app.getHttpServer())
        .put(`/servidores-temporarios/${servidorTempCriado.pes_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
    });

    it('deve retornar erro 404 ao atualizar ID inexistente (404 Not Found)', () => {
      const dto: UpdateServidorTemporarioDto = {
        st_data_demissao: '2025-01-01',
      };
      return request(app.getHttpServer())
        .put('/servidores-temporarios/999999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(404);
    });

    it('deve atualizar as datas de um servidor temporário com sucesso (200 OK)', async () => {
      const dto: UpdateServidorTemporarioDto = {
        st_data_admissao: '2022-02-01',
        st_data_demissao: '2023-01-31',
      };
      const response = await request(app.getHttpServer())
        .put(`/servidores-temporarios/${servidorTempCriado.pes_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(200);

      expect(response.body.pes_id).toBe(servidorTempCriado.pes_id);
      expect(new Date(response.body.st_data_admissao)).toEqual(
        new Date(dto.st_data_admissao!),
      );
      expect(new Date(response.body.st_data_demissao)).toEqual(
        new Date(dto.st_data_demissao!),
      );

      const dbCheck = await prisma.servidorTemporario.findUnique({
        where: { pes_id: servidorTempCriado.pes_id },
      });
      expect(dbCheck?.st_data_admissao).toEqual(
        new Date(dto.st_data_admissao!),
      );
      expect(dbCheck?.st_data_demissao).toEqual(
        new Date(dto.st_data_demissao!),
      );
    });

    it('deve retornar o registro existente se nenhum dado for enviado para atualização (200 OK)', async () => {
      const dto = {};
      const response = await request(app.getHttpServer())
        .put(`/servidores-temporarios/${servidorTempCriado.pes_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(200);

      expect(new Date(response.body.st_data_admissao)).toEqual(
        new Date('2022-02-01'),
      );
      expect(new Date(response.body.st_data_demissao)).toEqual(
        new Date('2023-01-31'),
      );
    });
  });
});
