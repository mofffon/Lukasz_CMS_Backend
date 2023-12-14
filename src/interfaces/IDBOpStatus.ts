import IUser from "./IUser";

export default interface IDBOpStatus {
  status: number;
  message: string;
  rows: IUser[] | null;
}
