import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ServidorEfetivoModule } from './servidor-efetivo/servidor-efetivo.module';
import { ServidorTemporarioModule } from './servidor-temporario/servidor-temporario.module';
import { UnidadeModule } from './unidade/unidade.module';
import { LotacaoModule } from './lotacao/lotacao.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    PrismaModule,
    AuthModule,
    ServidorEfetivoModule,
    ServidorTemporarioModule,
    UnidadeModule,
    LotacaoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
