import { IsInt, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateServidorTemporarioDto {
  @IsInt()
  @IsNotEmpty()
  pes_id: number;

  @IsDateString()
  @IsNotEmpty()
  st_data_admissao: string;

  @IsDateString()
  @IsNotEmpty()
  st_data_demissao: string;
}
