export default class DBUser {
  user_id: number;
  full_name: string;
  email: string;
  is_admin: boolean;
  hashed_password: string;

  constructor(
    user_id: number,
    full_name: string,
    is_admin: boolean,
    email: string,
    hashed_password: string
  ) {
    this.user_id = user_id;
    this.full_name = full_name;
    this.is_admin = is_admin;
    this.email = email;
    this.hashed_password = hashed_password;
  }
}
