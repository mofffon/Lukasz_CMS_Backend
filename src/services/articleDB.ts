import mysql from "mysql2/promise";

import getDayIntervals from "../utils/getDayIntervals";
import IArticle from "../interfaces/IArticle";
import Status from "../classes/Status";

class ArticleDB {
  private establishConnection = async (): Promise<mysql.Connection> => {
    return await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  };

  findNewestArticle = async (): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql =
      "SELECT * FROM articles join users_and_admins on articles.user_id = users_and_admins.id WHERE timestamp = (SELECT MAX(timestamp) FROM articles) LIMIT 1;";

    try {
      const [rows] = await connection.execute<IArticle[]>(sql);
      connection.end();
      const results = new Status(0, "Query run successfully.", rows);
      return results;
    } catch (error) {
      connection.end();
      console.log(error);
      const result = new Status(1, "Query run failed.", false);
      return result;
    }
  };

  find100Random = async (from: Date, to: Date): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql =
      "SELECT * FROM articles WHERE timestamp >= ? AND timestamp <= ?;";
    const data = [
      from.toISOString().split("T").join(" ").split("Z").join(""),
      to.toISOString().split("T").join(" ").split("Z").join(""),
    ];

    try {
      const [rows] = await connection.execute<IArticle[]>(sql, data);
      connection.end();
      const results = new Status(0, "Query run successfully.", rows);
      return results;
    } catch (error) {
      connection.end();
      console.log(error);
      const result = new Status(1, "Query run failed.", false);
      return result;
    }
  };

  addOne = async (
    userId: number,
    title: string,
    content: string[],
    category: string
  ): Promise<Status> => {
    const sql =
      "INSERT INTO articles(id, timestamp, user_id, title, content, category) VALUES( ?, ?, ?, ?, ?, ?);";

    const processedContent = "<p>" + content.join("</p><p>") + "</p>";

    const data = [
      null,
      new Date().toISOString().split("T").join(" ").split("Z").join(""),
      userId,
      title,
      processedContent,
      category,
    ];
    const connection = await this.establishConnection();

    let rows;

    try {
      [rows] = await connection.execute<IArticle[]>(sql, data);
      connection.end();
      const results = new Status(0, "Article Added.", rows);
      return results;
    } catch (error) {
      connection.end();
      console.log(error);
      const result = new Status(1, "Article not added", false);
      return result;
    }
  };

  listAllByUserFullName = async (userFullName: string): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql =
      "SELECT articles.id, title, category, timestamp FROM articles JOIN users_and_admins ON articles.user_id = users_and_admins.id WHERE full_name = ?;";
    const data = [userFullName];

    try {
      const [rows] = await connection.query<IArticle[]>(sql, data);
      connection.end();
      return new Status(0, `Query run succeded`, rows);
    } catch (error) {
      connection.end();
      console.log(error);
      return new Status(1, "Query run failed", null);
    }
  };

  findAllByCategory = async (category: string): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql =
      "SELECT id, title, content, timestamp, category FROM articles WHERE category = ?";
    const data = [category];

    try {
      const [rows] = await connection.query<IArticle[]>(sql, data);
      connection.end();
      return new Status(0, `Query run succeded`, rows);
    } catch (error) {
      connection.end();
      console.log(error);
      return new Status(1, "Query run failed", false);
    }
  };

  findAllByUserFullNameAndCategory = async (
    userFullName: string,
    category: string
  ): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql =
      "SELECT title, content, category, timestamp FROM articles JOIN users_and_admins ON articles.user_id = users_and_admins.id WHERE full_name = ? AND category = ?";
    const data = [userFullName, category];

    try {
      const [rows] = await connection.query<IArticle[]>(sql, data);
      connection.end();
      return new Status(0, `Query run succeded`, rows);
    } catch (error) {
      connection.end();
      console.log(error);
      return new Status(1, "Query run failed", false);
    }
  };

  findAllByTitle = async (title: string): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql = "SELECT * FROM articles WHERE title LIKE ?";
    const data = ["%" + title + "%"];

    try {
      const [rows] = await connection.query<IArticle[]>(sql, data);
      connection.end();
      return new Status(0, `Query run succeded`, rows);
    } catch (error) {
      connection.end();
      console.log(error);
      return new Status(1, "Query run failed", false);
    }
  };

  findOneRandom = async (from: Date, to: Date): Promise<Status> => {
    if (!from || !to) {
      from = new Date();
      to = new Date(from);
    }

    const dates = getDayIntervals(
      new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()))
    );

    const connection = await this.establishConnection();

    const sql =
      "SELECT * FROM articles WHERE timestamp >= ? AND timestamp <= ? LIMIT 1;";
    const data = [
      dates.startDate.toISOString().split("T").join(" ").split("Z").join(""),
      dates.endDate.toISOString().split("T").join(" ").split("Z").join(""),
    ];

    try {
      const [rows] = await connection.query<IArticle[]>(sql, data);
      await this.addArticleViewCount(rows[0].getId());
      connection.end();
      return new Status(0, `Query run succeded`, rows);
    } catch (error) {
      connection.end();
      console.log(error);
      return new Status(1, "Query run failed", false);
    }
  };

  findLastPosted = async (): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql =
      "SELECT * FROM articles WHERE timestamp = MAX(timestamp) LIMIT 1;";

    try {
      const [rows] = await connection.query<IArticle[]>(sql);
      await this.addArticleViewCount(rows[0].getId());
      connection.end();
      return new Status(0, `Query run succeded`, rows);
    } catch (error) {
      connection.end();
      console.log(error);
      return new Status(1, "Query run failed", false);
    }
  };

  findById = async (articleId: number): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql =
      "SELECT articles.id, title, content, category, timestamp, full_name FROM articles JOIN users_and_admins ON articles.user_id = users_and_admins.id WHERE articles.id = ? LIMIT 1;";
    const data = [articleId];

    try {
      const [rows] = await connection.query<IArticle[]>(sql, data);
      await this.addArticleViewCount(articleId);
      connection.end();
      return new Status(0, `Query run succeded`, rows);
    } catch (error) {
      connection.end();
      console.log(error);
      return new Status(1, "Query run failed", false);
    }
  };

  private addArticleViewCount = async (articleId: number): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql = "INSERT INTO visits VALUES(NULL, ?, ?);";
    const data = [
      articleId,
      new Date().toISOString().split("T").join(" ").split("Z").join(""),
    ];

    try {
      const [rows] = await connection.query<IArticle[]>(sql, data);
      connection.end();
      return new Status(0, `Query run succeded`, rows);
    } catch (error) {
      connection.end();
      console.log(error);
      return new Status(1, "Query run failed", false);
    }
  };

  findByTitleAndCategory = async (title: string, category: string) => {
    const connection = await this.establishConnection();

    const sql =
      "SELECT articles.id, title, content, category, timestamp, full_name FROM articles JOIN users_and_admins ON articles.user_id = users_and_admins.id WHERE title LIKE ? AND category = ?;";
    const data = ["%" + title + "%", category];

    try {
      const [rows] = await connection.query<IArticle[]>(sql, data);
      connection.end();
      return new Status(0, `Query run succeded`, rows);
    } catch (error) {
      connection.end();
      console.log(error);
      return new Status(1, "Query run failed", false);
    }
  };

  updateArticle = async (
    id: number,
    title: string,
    category: string,
    content: string[]
  ) => {
    const connection = await this.establishConnection();

    const sql =
      "UPDATE articles SET title=?, content=?, category=? WHERE id=?;";

    const processedContent =
      "<p>" +
      (Array.isArray(content) ? content.join("</p><p>") : content) +
      "</p>";

    const data = [title, processedContent, category, id];

    try {
      const [rows] = await connection.query<IArticle[]>(sql, data);
      connection.end();
      return new Status(0, `Query run succeded`, rows);
    } catch (error) {
      connection.end();
      console.log(error);
      return new Status(1, "Query run failed", false);
    }
  };

  deleteArticle = async (id: number) => {
    const connection = await this.establishConnection();

    const sql = "DELETE FROM articles WHERE id=?;";
    const data = [id];

    try {
      const [rows] = await connection.query<IArticle[]>(sql, data);
      connection.end();
      return new Status(0, `Query run succeded`, rows);
    } catch (error) {
      connection.end();
      console.log(error);
      return new Status(1, "Query run failed", false);
    }
  };
}

export default new ArticleDB();
