import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  get skip(): number {
    const page = this.page ?? 1;
    const pageSize = this.pageSize ?? 10;
    return (page - 1) * pageSize;
  }

  get take(): number {
    return this.pageSize ?? 10;
  }
}
