import { Module } from '@nestjs/common';
import { ServidorEfetivoService } from './servidor-efetivo.service';
import { ServidorEfetivoController } from './servidor-efetivo.controller';

@Module({
  controllers: [ServidorEfetivoController],
  providers: [ServidorEfetivoService],
})
export class ServidorEfetivoModule {}
