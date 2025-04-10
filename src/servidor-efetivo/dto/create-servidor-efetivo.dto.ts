import { IsNotEmpty, IsString, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePessoaDto } from '../../pessoa/dto/create-pessoa.dto';

export class CreateServidorEfetivoDto {
  @ValidateNested()
  @Type(() => CreatePessoaDto)
  @IsNotEmpty()
  pessoa: CreatePessoaDto;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  se_matricula: string;
}
