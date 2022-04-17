import { IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class TestDto {
  @IsDate()
  @Type(() => Date)
  public date: Date;
}
