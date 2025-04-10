import { IsString, Length, IsNotEmpty } from 'class-validator';

export class CreateUnidadeDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  unid_nome: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  unid_sigla: string;
}
