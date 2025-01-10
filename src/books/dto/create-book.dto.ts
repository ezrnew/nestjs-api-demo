import { IsNotEmpty, IsNumber, IsNumberString } from 'class-validator';

export class CreateBookDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  @IsNumber()
  publicationYear: number;

  @IsNotEmpty()
  @IsNumber()
  authorId: number;
}
