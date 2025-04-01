import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Cidades (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let jwtToken: string;
  let createdCidadeId: number | null = null;

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

    // Gerar token JWT para testes autenticados
    const payload = { username: 'testuser', sub: 1 }; // Adapte o payload se necessário
    jwtToken = jwtService.sign(payload);

    // Limpar dados de teste anteriores (opcional, mas recomendado)
    await prisma.cidade.deleteMany({}); // Cuidado: Apaga todas as cidades!
  });

  afterAll(async () => {
    // Limpar dados criados durante o teste (opcional)
    if (createdCidadeId) {
      try {
        await prisma.cidade.delete({ where: { cid_id: createdCidadeId } });
      } catch (error) {
        console.error('Failed to clean up test cidade:', error);
      }
    }
    await prisma.cidade.deleteMany({});
    await app.close();
  });

  describe('/cidades (POST)', () => {
    it('deve rejeitar a requisição sem token de autenticação (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .post('/cidades')
        .send({ cid_nome: 'Cidade Teste Sem Token', cid_uf: 'ST' })
        .expect(401);
    });

    it('deve criar uma cidade com sucesso com token de autenticação (201 Created)', async () => {
      const createDto = { cid_nome: 'Cidade Nova', cid_uf: 'CN' };
      const response = await request(app.getHttpServer())
        .post('/cidades')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('cid_id');
      expect(response.body.cid_nome).toEqual(createDto.cid_nome);
      expect(response.body.cid_uf).toEqual(createDto.cid_uf);
      createdCidadeId = response.body.cid_id;
    });

    it('deve rejeitar requisição com payload inválido (sem cid_nome) (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post('/cidades')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ cid_uf: 'ER' })
        .expect(400);
    });

    it('deve rejeitar requisição com payload inválido (sem cid_uf) (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post('/cidades')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ cid_nome: 'Cidade Erro' })
        .expect(400);
    });

    it('deve rejeitar requisição com payload inválido (cid_uf com tamanho errado) (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post('/cidades')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ cid_nome: 'Cidade Erro Tam', cid_uf: 'ERR' })
        .expect(400);
    });

    it('deve rejeitar requisição com payload vazio (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post('/cidades')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({})
        .expect(400);
    });
  });
});
