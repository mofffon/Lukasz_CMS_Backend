import IArticle from "./IArticle";
import IUser from "./IUser";

export default interface IDBOpStatus {
  status: number;
  message: string;
  rows: IUser[] | IArticle[] | null | false;
}
