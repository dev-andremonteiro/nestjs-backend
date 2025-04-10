import { IsString, IsNotEmpty, IsDateString, IsEnum } from 'class-validator';

export enum Sexo {
  MASCULINO = 'MASCULINO',
  FEMININO = 'FEMININO',
}

export class CreatePessoaDto {
  @IsString()
  @IsNotEmpty()
  pes_nome: string;

  @IsDateString()
  @IsNotEmpty()
  pes_data_nascimento: string;

  @IsEnum(Sexo)
  @IsNotEmpty()
  pes_sexo: Sexo;

  @IsString()
  @IsNotEmpty()
  pes_mae: string;

  @IsString()
  @IsNotEmpty()
  pes_pai: string;
}
