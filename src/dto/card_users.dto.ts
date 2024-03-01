import { IsDefined, IsUUID } from "class-validator";

export class Card_User {
  @IsUUID()
  @IsDefined()
  cardId: string;}