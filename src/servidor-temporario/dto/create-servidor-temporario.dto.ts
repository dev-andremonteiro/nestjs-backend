import { IsDateString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePessoaDto } from '../../pessoa/dto/create-pessoa.dto';

export class CreateServidorTemporarioDto {
  @ValidateNested()
  @Type(() => CreatePessoaDto)
  @IsNotEmpty()
  pessoa: CreatePessoaDto;

  @IsDateString()
  @IsNotEmpty()
  st_data_admissao: string;

  @IsDateString()
  @IsNotEmpty()
  st_data_demissao: string;
}
