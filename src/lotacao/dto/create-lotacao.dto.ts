import {
  IsInt,
  IsDateString,
  IsString,
  Length,
  IsNotEmpty,
} from 'class-validator';

export class CreateLotacaoDto {
  @IsInt()
  @IsNotEmpty()
  pes_id: number;

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
