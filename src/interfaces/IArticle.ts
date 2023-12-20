import { RowDataPacket } from "mysql2";

export default interface IArticle extends RowDataPacket {
  getId: () => number;
  getTimestamp: () => Date;
  getUser_id: () => number;
  getTitle: () => string;
  getContent: () => string[];
}
