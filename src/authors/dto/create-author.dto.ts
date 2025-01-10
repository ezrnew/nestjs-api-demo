import { Length } from 'class-validator';

export class CreateAuthorDto {
  @Length(2, 100)
  firstName: string;

  @Length(2, 100)
  lastName: string;
}
