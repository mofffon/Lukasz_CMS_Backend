import bcrypt from "bcrypt";

const saltRounds = 10;
export default async (plainTextPassword: string) => {
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(plainTextPassword, salt);
};
