import {
  IsInt,
  IsDateString,
  IsString,
  Length,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePessoaDto } from '../../pessoa/dto/create-pessoa.dto';

export class CreateLotacaoDto {
  @IsOptional()
  @IsInt()
  pes_id?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePessoaDto)
  pessoa?: CreatePessoaDto;

  @IsInt()
  @IsNotEmpty()
  unid_id: number;

  @IsDateString()
  @IsNotEmpty()
  lot_data_lotacao: string;

  @IsDateString()
  @IsNotEmpty()
  lot_data_remocao: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  lot_portaria: string;
}
