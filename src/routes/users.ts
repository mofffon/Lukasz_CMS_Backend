import bcrypt from "bcrypt";
import express, { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
const router = express.Router();

import auth from "./../middleware/auth";
import DBUser from "../classes/DBUser";
import hasher from "./../services/hasher";
import userDB from "../services/userDB";
import Status from "../classes/Status";
import * as validators from "./../services/validators";

import IExtendedRequest from "../interfaces/IExtendedRequest";
import adminAuth from "../middleware/adminAuth";

router.post(
  "/new",
  expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      await validators.userSchema.validateAsync(req.body);
    } catch (error: any) {
      res.status(400).send(error.message);
      return;
    }

    const { full_name, email, password } = req.body;

    const found = await userDB.findOneAlt(full_name, email);
    if (found.rows && found.rows.length) {
      res.status(400).send("User already exists");
      return;
    }

    const hashed_password = await hasher(password);
    const status = await userDB.createOne(full_name, email, hashed_password);

    res.status(201).send(status.message);
    return;
  })
);

router.delete(
  "/myself",
  auth,
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }

      const { full_name, email } = req.user;

      const found: Status = await userDB.findOneAlt(full_name, email);

      if (!found.rows || !found.rows.length) {
        res.status(400).send("No user found for deletion.");
        return;
      }
      let deletee: DBUser;
      deletee = new DBUser(
        found.rows[0].user_id,
        found.rows[0].full_name,
        found.rows[0].is_admin,
        found.rows[0].email,
        found.rows[0].hashed_password
      );

      const result = await userDB.deleteUser(deletee);

      if (result.status === 0) {
        res.status(200).send(result.message);
        return;
      } else {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }
    }
  )
);

router.post(
  "/login",
  expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      await validators.userSchema.validateAsync(req.body);
    } catch (error: any) {
      res.status(400).send(error.message);
      return;
    }

    const {
      full_name: searchedFull_name,
      email: searchedEmail,
      password,
    } = req.body;

    const result = await userDB.findOneAlt(searchedFull_name, searchedEmail);

    if (!result.rows || result.rows.length === 0) {
      res.status(400).send("No user found.");
      return;
    }

    const match = await bcrypt.compare(
      password,
      result.rows[0].hashed_password
    );
    if (!match) {
      res.status(400).send("Invalid password.");
      return;
    }

    const { id, is_admin, full_name, email } = result.rows[0];

    const userObj = { id, is_admin, full_name, email };

    if (process.env.JWT_PRIVATE_KEY_USER) {
      const token = jwt.sign(userObj, process.env.JWT_PRIVATE_KEY_USER);
      res
        .header("x-auth-token", token)
        .status(200)
        .send("You are logged in. Welcome.");
      return;
    } else {
      res.status(500).send("Something went wrong. We are working on it.");
      return;
    }
  })
);

router.put(
  "/updatePassword",
  auth,
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(500).send("Something went wrong. We are workng on it.");
        return;
      }

      try {
        await validators.passwordUpdateSchema.validateAsync(req.body);
      } catch (error: any) {
        res.status(400).send(error.message);
        return;
      }

      const result = await userDB.findOneAlt(
        req.user.full_name,
        req.user.email
      );

      if (!result.rows || result.rows.length === 0) {
        res.status(400).send("No user found.");
        return;
      }

      const { old_password, new_password } = req.body;

      const match = await bcrypt.compare(
        old_password,
        result.rows[0].hashed_password
      );
      if (!match) {
        res.status(400).send("Invalid old password.");
        return;
      }

      const new_password_hash = await hasher(new_password);

      const updateResult = await userDB.updatePassword(
        req.user.id,
        new_password_hash
      );

      if (updateResult.status === 0) {
        res.status(200).send("User " + updateResult.message);
        return;
      } else {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }
    }
  )
);

router.put(
  "/updateEmail",
  auth,
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(500).send("Something went wrong. We are workng on it.");
        return;
      }

      try {
        await validators.emailUpdateSchema.validateAsync(req.body);
      } catch (error: any) {
        res.status(400).send(error.message);
        return;
      }

      const { old_email, new_email } = req.body;

      const found = await userDB.findEmails(old_email);

      if (found.status !== 0) {
        res.status(500).send("Something went wrong. We are workingon it.");
      }

      if (found.rows === false) {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }

      if (found.rows === null || found.rows.length === 0) {
        res.status(400).send(`No user by email ${old_email} found in the app.`);
        return;
      }

      const result = await userDB.updateEmail(
        req.user.id,
        old_email,
        new_email
      );

      if (result.status === 0) {
        res.status(200).send(result.message);
        return;
      } else {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }
    }
  )
);

router.get(
  "/all",
  adminAuth,
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      if (!req.admin) {
        res.status(500).send("Something went wrong. We are workng on it.");
        return;
      }

      const result = await userDB.findAllUsers();

      if (result.status !== 0) {
        res.status(500).send("Something went wrong. We are workng on it.");
        return;
      }

      if (!result.rows) {
        res.status(200).send("No data was found.");
        return;
      }

      res.status(200).send(result.rows);
    }
  )
);

router.get(
  "/myself",
  auth,
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }

      const response = {
        id: req.user.id,
        full_name: req.user.full_name,
        email: req.user.email,
      };

      res.status(200).send(response);
    }
  )
);

export default router;
