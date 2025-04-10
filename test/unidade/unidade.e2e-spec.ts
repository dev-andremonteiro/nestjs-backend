import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Unidade } from '@prisma/client';
import { CreateUnidadeDto } from '../../src/unidade/dto/create-unidade.dto';
import { UpdateUnidadeDto } from '../../src/unidade/dto/update-unidade.dto';

describe('Unidades (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let jwtToken: string;
  let unidadeCriada: Unidade;

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

    const payload = { username: 'testuser-unidade', sub: 99 };
    jwtToken = jwtService.sign(payload);

    await prisma.lotacao.deleteMany({});
    await prisma.unidadeEndereco.deleteMany({});
    await prisma.unidade.deleteMany({});
  });

  afterAll(async () => {
    await prisma.lotacao.deleteMany({});
    await prisma.unidadeEndereco.deleteMany({});
    await prisma.unidade.deleteMany({});
    await app.close();
  });

  describe('/unidades (POST)', () => {
    it('deve rejeitar a criação sem token (401 Unauthorized)', () => {
      const dto: CreateUnidadeDto = {
        unid_nome: 'Teste Sem Token',
        unid_sigla: 'TST',
      };
      return request(app.getHttpServer())
        .post('/unidades')
        .send(dto)
        .expect(401);
    });

    it('deve rejeitar a criação com payload inválido (sem nome) (400 Bad Request)', () => {
      const dto = { unid_sigla: 'INV' };
      return request(app.getHttpServer())
        .post('/unidades')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
    });

    it('deve criar uma unidade com sucesso (201 Created)', async () => {
      const dto: CreateUnidadeDto = {
        unid_nome: 'Unidade Principal',
        unid_sigla: 'UPRI',
      };
      const response = await request(app.getHttpServer())
        .post('/unidades')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(201);

      expect(response.body).toHaveProperty('unid_id');
      expect(response.body.unid_nome).toEqual(dto.unid_nome);
      expect(response.body.unid_sigla).toEqual(dto.unid_sigla);
      unidadeCriada = response.body;
    });
  });

  describe('/unidades (GET)', () => {
    let unidade1: Unidade, unidade2: Unidade, unidade3: Unidade;

    beforeAll(async () => {
      await prisma.unidade.deleteMany({});
      unidade1 = await prisma.unidade.create({
        data: { unid_nome: 'Unidade A', unid_sigla: 'UA' },
      });
      unidade2 = await prisma.unidade.create({
        data: { unid_nome: 'Unidade B', unid_sigla: 'UB' },
      });
      unidade3 = await prisma.unidade.create({
        data: { unid_nome: 'Unidade C', unid_sigla: 'UC' },
      });
      unidadeCriada = unidade1;
    });

    it('deve rejeitar a listagem sem token (401 Unauthorized)', () => {
      return request(app.getHttpServer()).get('/unidades').expect(401);
    });

    it('deve retornar a primeira página de unidades (200 OK)', async () => {
      const response = await request(app.getHttpServer())
        .get('/unidades?page=1&pageSize=2')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(3);
      expect(response.body.data[0].unid_id).toBe(unidade1.unid_id);
      expect(response.body.data[1].unid_id).toBe(unidade2.unid_id);
    });

    it('deve retornar a segunda página de unidades (200 OK)', async () => {
      const response = await request(app.getHttpServer())
        .get('/unidades?page=2&pageSize=2')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.count).toBe(3);
      expect(response.body.data[0].unid_id).toBe(unidade3.unid_id);
    });
  });

  describe('/unidades/:id (GET)', () => {
    it('deve rejeitar a busca por ID sem token (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .get(`/unidades/${unidadeCriada.unid_id}`)
        .expect(401);
    });

    it('deve retornar uma unidade específica (200 OK)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/unidades/${unidadeCriada.unid_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
      expect(response.body.unid_id).toBe(unidadeCriada.unid_id);
      expect(response.body.unid_nome).toBe(unidadeCriada.unid_nome);
    });

    it('deve retornar erro 404 para ID inexistente (404 Not Found)', () => {
      return request(app.getHttpServer())
        .get('/unidades/999999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(404);
    });

    it('deve retornar erro 400 para ID inválido (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .get('/unidades/invalid')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(400);
    });
  });

  describe('/unidades/:id (PUT)', () => {
    it('deve rejeitar a atualização sem token (401 Unauthorized)', () => {
      const dto: UpdateUnidadeDto = { unid_nome: 'Update Sem Token' };
      return request(app.getHttpServer())
        .put(`/unidades/${unidadeCriada.unid_id}`)
        .send(dto)
        .expect(401);
    });

    it('deve rejeitar a atualização com ID inválido (400 Bad Request)', () => {
      const dto: UpdateUnidadeDto = { unid_nome: 'Update Inválido' };
      return request(app.getHttpServer())
        .put('/unidades/invalid')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
    });

    it('deve rejeitar a atualização com payload inválido (nome muito longo) (400 Bad Request)', async () => {
      const longName = 'a'.repeat(201);
      const dto = { unid_nome: longName };
      await request(app.getHttpServer())
        .put(`/unidades/${unidadeCriada.unid_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(400);
    });

    it('deve retornar erro 404 ao atualizar ID inexistente (404 Not Found)', () => {
      const dto: UpdateUnidadeDto = { unid_nome: 'Inexistente' };
      return request(app.getHttpServer())
        .put('/unidades/999999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(404);
    });

    it('deve atualizar uma unidade com sucesso (200 OK)', async () => {
      const dto: UpdateUnidadeDto = {
        unid_nome: 'Unidade Atualizada',
        unid_sigla: 'UA',
      };
      const response = await request(app.getHttpServer())
        .put(`/unidades/${unidadeCriada.unid_id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(dto)
        .expect(200);

      expect(response.body.unid_id).toBe(unidadeCriada.unid_id);
      expect(response.body.unid_nome).toBe(dto.unid_nome);
      expect(response.body.unid_sigla).toBe(dto.unid_sigla);

      const dbCheck = await prisma.unidade.findUnique({
        where: { unid_id: unidadeCriada.unid_id },
      });
      expect(dbCheck?.unid_nome).toBe(dto.unid_nome);
      expect(dbCheck?.unid_sigla).toBe(dto.unid_sigla);
    });
  });
});
