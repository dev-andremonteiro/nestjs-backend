import { Module } from '@nestjs/common';
import { LotacaoService } from './lotacao.service';
import { LotacaoController } from './lotacao.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LotacaoController],
  providers: [LotacaoService],
})
export class LotacaoModule {}
