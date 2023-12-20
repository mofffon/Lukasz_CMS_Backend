import IArticle from "../interfaces/IArticle";
import IDBOpStatus from "../interfaces/IDBOpStatus";
import IUser from "../interfaces/IUser";

export default class Status implements IDBOpStatus {
  status: number;
  message: string;
  rows: IUser[] | IArticle[] | null | false;

  constructor(
    status: number,
    message: string,
    rows: IUser[] | null | IArticle[] | false
  ) {
    this.status = status;
    this.message = message;
    this.rows = rows;
  }
}
