import { IsInt, IsString, Length, IsNotEmpty } from 'class-validator';

export class CreateServidorEfetivoDto {
  @IsInt()
  @IsNotEmpty()
  pes_id: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  se_matricula: string;
}
