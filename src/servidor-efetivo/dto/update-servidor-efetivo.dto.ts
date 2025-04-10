import { PartialType } from '@nestjs/mapped-types';
import { CreateServidorEfetivoDto } from './create-servidor-efetivo.dto';

export class UpdateServidorEfetivoDto extends PartialType(
  CreateServidorEfetivoDto,
) {}
