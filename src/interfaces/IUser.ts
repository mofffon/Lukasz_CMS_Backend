import { RowDataPacket } from "mysql2";

export default interface IUser extends RowDataPacket {
  id: number;
  is_admin: boolean;
  full_name: string;
  email: string;
  hashed_password: string;
}
