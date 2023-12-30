import mysql from "mysql2/promise";

import DBUser from "./../classes/DBUser";
import IUser from "../interfaces/IUser";
import Status from "../classes/Status";

class UserDB {
  private establishConnection = async (): Promise<mysql.Connection> => {
    return await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  };

  findAllUsers = async () => {
    const connection = await this.establishConnection();

    const sql = `SELECT * FROM users_and_admins WHRE is_admin = FALSE;`;

    try {
      const [rows] = await connection.execute<IUser[]>(sql);
      connection.end();
      const results = new Status(0, "Rows found.", rows);
      return results;
    } catch (error) {
      console.log(error);
      connection.end();
      const results = new Status(
        1,
        "Something went wrong. We are working on it.",
        false
      );
      return results;
    }
  };

  findOneAdmin = async (id: number): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql = `SELECT * FROM users_and_admins WHERE id = ? AND is_admin = true AND is_active = TRUE;`;
    const data = [id];

    try {
      const [rows] = await connection.execute<IUser[]>(sql, data);
      connection.end();
      const results = new Status(0, "Rows found.", rows);
      return results;
    } catch (error) {
      console.log(error);
      connection.end();
      const results = new Status(
        1,
        "Something went wrong. We are working on it.",
        false
      );
      return results;
    }
  };

  findOneAdminAlt = async (
    full_name: string,
    email: string
  ): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql = `SELECT * FROM users_and_admins WHERE (full_name = ? OR email = ?) AND is_admin = true AND is_active = TRUE;`;
    const data = [full_name, email];
    let rows;
    try {
      [rows] = await connection.execute<IUser[]>(sql, data);
      connection.end();
    } catch (error) {
      connection.end();
      console.log(error);
      const results = new Status(
        1,
        "Something went wrong. We are working on it.",
        null
      );
      return results;
    }

    const results = new Status(0, "Rows found.", rows);
    return results;
  };

  findOne = async (id: string): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql = `SELECT * FROM users_and_admins WHERE id = ?  AND is_active = TRUE;`;
    const data = [id];
    let rows;

    try {
      [rows] = await connection.execute<IUser[]>(sql, data);
      connection.end();
    } catch (error) {
      connection.end();
      const results = new Status(
        1,
        "Something went wrong. We are working on it.",
        null
      );
      return results;
    }

    const results = new Status(0, "Rows found.", rows);
    return results;
  };

  findOneAlt = async (full_name: string, email: string): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql = `SELECT * FROM users_and_admins WHERE is_admin = FALSE AND (full_name = ? OR email = ?)  AND is_active = TRUE;`;
    const data = [full_name, email];
    let rows;
    try {
      [rows] = await connection.execute<IUser[]>(sql, data);
      connection.end();
    } catch (error) {
      connection.end();
      console.log(error);
      const results = new Status(
        1,
        "Something went wrong. We are working on it.",
        null
      );
      return results;
    }

    const results = new Status(0, "Rows Found.", rows);
    return results;
  };

  createOne = async (
    full_name: string,
    email: string,
    hashed_password: string
  ): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql = `INSERT INTO users_and_admins values(NULL, false, ?, ?, ?, 1);`;
    const data: (string | boolean)[] = [full_name, email, hashed_password];
    let rows;
    try {
      [rows] = await connection.query<IUser[]>(sql, data);
      connection.end();
    } catch (error) {
      connection.end();
      console.log(error);
      return new Status(1, "Something went wrong, we are working on it", null);
    }

    return new Status(0, "User created", rows);
  };

  findEmails = async (email: string): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql =
      "SELECT * FROM users_and_admins WHERE email = ?  AND is_active = TRUE;";
    const data = [email];

    try {
      const [rows] = await connection.query<IUser[]>(sql, data);
      connection.end();
      return new Status(0, "User looked up", rows);
    } catch (error) {
      connection.end();
      console.log(error);
      return new Status(1, "Something went wrong, we are working on it", null);
    }
  };

  updateEmail = async (
    user_id: number,
    old_email: string,
    new_email: string
  ): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql = `UPDATE users_and_admins SET email = ? WHERE id= ? AND email = ? AND is_active = TRUE`;
    const data = [new_email, user_id, old_email];

    try {
      const [rows] = await connection.query<IUser[]>(sql, data);
      connection.end();
      return new Status(0, "User email updated", rows);
    } catch (error) {
      connection.end();
      console.log(error);
      return new Status(1, "Something went wrong, we are working on it", null);
    }
  };

  updatePassword = async (
    user_id: number,
    new_hashed_password: string
  ): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql = `UPDATE users_and_admins SET hashed_password = ? WHERE id = ? AND is_active = TRUE;`;
    const data = [new_hashed_password, user_id];

    try {
      const [rows] = await connection.query<IUser[]>(sql, data);
      connection.end();
      return new Status(0, "password updated.", rows);
    } catch (error) {
      console.log(error);
      return new Status(1, "Something went wrong, we are working on it", null);
    }
  };

  deleteUser = async (user: DBUser): Promise<Status> => {
    const connection = await this.establishConnection();

    const { user_id, full_name, email } = user;

    const sql =
      "DELETE FROM users_and_admins WHERE user_id = ? AND is_admin = FALSE AND full_name = ? AND email = ? AND is_active = TRUE;";
    const data = [user_id, full_name, email];

    try {
      const [rows] = await connection.query<IUser[]>(sql, data);
      connection.end();
      return new Status(0, `User ${full_name} (${email}) deleted.`, rows);
    } catch (error) {
      console.log(error);
      return new Status(1, "Something went wrong, we are working on it", null);
    }
  };

  upgradeUserToAdmin = async (user: DBUser): Promise<Status> => {
    const connection = await this.establishConnection();

    const { user_id, is_admin, full_name, email } = user;

    const sql =
      "UPDATE users_and_admins SET is_admin = TRUE AND WHERE id = ? AND is_admin = ? AND full_name = ? AND email = ? LIMIT 1;";
    const data = [user_id, is_admin, full_name, email];

    try {
      const [rows] = await connection.query<IUser[]>(sql, data);
      connection.end();
      return new Status(
        0,
        `User ${full_name} (${email}) upgraded to admin.`,
        rows
      );
    } catch (error) {
      console.log(error);
      return new Status(1, "Something went wrong, we are working on it", null);
    }
  };

  downgradeAdminToUser = async (
    id: number,
    full_name: string,
    email: string
  ): Promise<Status> => {
    const connection = await this.establishConnection();

    const sql =
      "UPDATE users_and_admins SET is_admin = FALSE WHERE id = ? AND is_admin = TRUE AND full_name = ? AND email = ?;";
    const data = [id, full_name, email];

    try {
      const [rows] = await connection.query<IUser[]>(sql, data);
      connection.end();
      return new Status(0, `Query run succeded`, rows);
    } catch (error) {
      connection.end();
      console.log(error);
      return new Status(1, "Query run failed", null);
    }
  };
}

export default new UserDB();
