import { Module } from '@nestjs/common';
import { ServidorTemporarioService } from './servidor-temporario.service';
import { ServidorTemporarioController } from './servidor-temporario.controller';

@Module({
  controllers: [ServidorTemporarioController],
  providers: [ServidorTemporarioService],
})
export class ServidorTemporarioModule {}
