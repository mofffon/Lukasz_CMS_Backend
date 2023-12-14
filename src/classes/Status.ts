import IDBOpStatus from "../interfaces/IDBOpStatus";
import IUser from "../interfaces/IUser";

export default class Status implements IDBOpStatus {
  status: number;
  message: string;
  rows: IUser[] | null;

  constructor(status: number, message: string, rows: IUser[] | null) {
    this.status = status;
    this.message = message;
    this.rows = rows;
  }
}
