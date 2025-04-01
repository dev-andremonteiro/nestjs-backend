import { IsString, Length, IsNotEmpty } from 'class-validator';

export class CreateCidadeDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  cid_nome: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  cid_uf: string;
}
