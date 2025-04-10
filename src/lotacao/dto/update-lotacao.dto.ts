import { PartialType } from '@nestjs/mapped-types';
import { CreateLotacaoDto } from './create-lotacao.dto';
import {
  IsDateString,
  IsOptional,
  IsString,
  Length,
  IsInt,
} from 'class-validator';

export class UpdateLotacaoDto extends PartialType(CreateLotacaoDto) {
  @IsOptional()
  @IsInt()
  pes_id?: number;

  @IsOptional()
  @IsInt()
  unid_id?: number;

  @IsOptional()
  @IsDateString()
  lot_data_lotacao?: string;

  @IsOptional()
  @IsDateString()
  lot_data_remocao?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lot_portaria?: string;
}
