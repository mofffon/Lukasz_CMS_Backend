export default class DBArticle {
  private id: number;
  private timestamp: Date;
  private user_id: number;
  private title: string;
  private content: string[];

  constructor(
    id: number,
    timestamp: Date,
    user_id: number,
    title: string,
    content: string[]
  ) {
    this.id = id;
    this.timestamp = timestamp;
    this.user_id = user_id;
    this.title = title;
    this.content = content;
  }

  public getId = () => {
    return this.id;
  };

  public getTimestamp = () => {
    return this.timestamp;
  };

  public getUser_id = () => {
    return this.user_id;
  };

  public getTitle = () => {
    return this.title;
  };

  public getContent = () => {
    return this.content;
  };
}
