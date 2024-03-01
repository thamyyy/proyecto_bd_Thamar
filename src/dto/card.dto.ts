import { IsDefined, IsString, IsUUID, Length } from "class-validator";

export class Card {
  @IsDefined()
  @IsUUID()
  list_id: string;

  @IsString()
  @IsDefined()
  @Length(5, 30)
  title: string;

  @IsString()
  @IsDefined()
  @Length(4, 100)
  description: string;

  @IsDefined()
  @IsUUID()
  user_Id: string;

  @IsDefined()
  @IsString()
  date_exp: string;
}