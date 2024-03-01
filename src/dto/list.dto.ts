import { IsDefined, IsString, IsUUID, Length } from "class-validator";

export class List {

  @IsDefined()
  @IsUUID()
  boardId: string;
    
  @IsString()
  @IsDefined()
  @Length(5, 30)
  name: string;
}