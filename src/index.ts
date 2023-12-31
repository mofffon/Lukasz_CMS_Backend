import dotenv from "dotenv";
import express from "express";

import admins from "./routes/admins";
import users from "./routes/users";
import articles from "./routes/articles";

const app = express();
if (process.env.NODE_ENV !== "production") dotenv.config();

app.use(express.json());

app.use(function (req, res, next) {
  console.log(req);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-auth-token");
  res.header("Access-Control-Expose-Headers", "x-auth-token");
  next();
});

app.use("/api/users", users);
app.use("/api/admins", admins);
app.use("/api/articles", articles);
app.listen(process.env.APP_PORT || 8080, () => {
  console.log(`App listening on ${process.env.APP_PORT}.`);
});
