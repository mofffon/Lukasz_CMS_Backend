import dotenv from "dotenv";
import express from "express";

import admins from "./routes/admins";
import users from "./routes/users";
import articles from "./routes/articles";

const app = express();
if (process.env.NODE_ENV !== "production") dotenv.config();

app.use(express.json());

app.use("/api/users", users);
app.use("/api/admins", admins);
app.use("/api/articles", articles);
app.listen(process.env.APP_PORT || 8080, () => {
  console.log(`App listening on ${process.env.APP_PORT}.`);
});
