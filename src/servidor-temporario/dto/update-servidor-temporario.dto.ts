import { PartialType } from '@nestjs/mapped-types';
import { CreateServidorTemporarioDto } from './create-servidor-temporario.dto';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateServidorTemporarioDto extends PartialType(
  CreateServidorTemporarioDto,
) {
  @IsOptional()
  @IsDateString()
  st_data_admissao?: string;

  @IsOptional()
  @IsDateString()
  st_data_demissao?: string;
}
