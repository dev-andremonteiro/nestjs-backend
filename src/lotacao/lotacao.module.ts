import { Module } from '@nestjs/common';
import { LotacaoService } from './lotacao.service';
import { LotacaoController } from './lotacao.controller';

@Module({
  controllers: [LotacaoController],
  providers: [LotacaoService],
})
export class LotacaoModule {}
