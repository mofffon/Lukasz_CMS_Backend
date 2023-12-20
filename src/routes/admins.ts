import bcrypt from "bcrypt";
import expressAsyncHandler from "express-async-handler";
import express, { Request, Response } from "express";

import jwt from "jsonwebtoken";
const router = express.Router();

import adminAuth from "./../middleware/adminAuth";
import hasher from "../services/hasher";
import userDB from "../services/userDB";
import Status from "../classes/Status";
import * as validators from "./../services/validators";

import IExtendedRequest from "../interfaces/IExtendedRequest";
import DBUser from "../classes/DBUser";

router.post(
  "/login",
  expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      await validators.adminSchema.validateAsync(req.body);
    } catch (error: any) {
      res.status(400).send(error.message);
      return;
    }

    const {
      full_name: searchedFull_name,
      email: searchedEmail,
      password,
    } = req.body;

    const result = await userDB.findOneAdminAlt(
      searchedFull_name,
      searchedEmail
    );

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
    if (process.env.JWT_PRIVATE_KEY_ADMIN) {
      const token = jwt.sign(userObj, process.env.JWT_PRIVATE_KEY_ADMIN, {
        expiresIn: 3600,
      });
      res
        .header("x-auth-token", token)
        .status(200)
        .send("You are logged in Admin. Welcome.");
      return;
    } else {
      res.status(500).send("Something went wrong. We are working on it.");
      return;
    }
  })
);

router.put(
  "/updatePassword",
  adminAuth,
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      if (!req.admin) {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }
      try {
        await validators.passwordUpdateSchema.validateAsync(req.body);
      } catch (error: any) {
        console.log(error);
        res.status(400).send(error.message);
        return;
      }

      const { new_password } = req.body;

      const new_password_hash = await hasher(new_password);

      const result = await userDB.updatePassword(
        req.admin.id,
        new_password_hash
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

router.put(
  "/updateEmail",
  adminAuth,
  async (req: IExtendedRequest, res: Response) => {
    if (!req.admin) {
      res.status(500).send("Something went wrong. We are working on it.");
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

    if (!found.rows || found.rows.length > 1) {
      res.status(500).send("Something went wrong. We are working on it.");
      return;
    }

    if (found.rows && found.rows.length === 0) {
      res.status(400).send(`No user by email ${old_email} found in the app.`);
      return;
    }

    const result = await userDB.updateEmail(req.admin.id, old_email, new_email);

    if (result.status === 0) {
      res.status(200).send(result.message);
      return;
    } else {
      res.status(500).send("Something went wrong. We are working on it.");
      return;
    }
  }
);

router.put(
  "/updgradeUserToAdmin",
  adminAuth,
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      if (!req.admin) {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }

      try {
        validators.id.validateAsync(req.body);
      } catch (error: any) {
        res.status(400).send(error.message);
        return;
      }

      const { id: upgradeeUserId } = req.body;

      const result1: Status = await userDB.findOne(upgradeeUserId);

      if (!result1.rows) {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }

      if (result1.rows.length === 0) {
        res.status(400).send("No user found.");
        return;
      }

      if (result1.rows[0].is_admin) {
        res
          .status(400)
          .send(
            `${result1.rows[0].full_name} (${result1.rows[0].email}) is already an Admin.`
          );
        return;
      }

      const upgradee: DBUser = new DBUser(
        upgradeeUserId,
        result1.rows[0].full_name,
        result1.rows[0].is_admin,
        result1.rows[0].email,
        result1.rows[0].hashed_password
      );

      const result2 = await userDB.upgradeUserToAdmin(upgradee);

      if (result2.status !== 0) res.status(500).send(result2.message);

      res.status(203).send(result2.message);
    }
  )
);

router.put(
  "/downgradeOtherAdminToUser",
  adminAuth,
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      if (!req.admin) {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }

      const result1 = await userDB.findOneAdmin(req.body.id);

      if (result1.status !== 0) {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }

      if (result1.rows && result1.rows.length === 0) {
        res.status(400).send("The admin for downgrading was not found.");
        return;
      }

      const { id, full_name, email } = req.body;

      if (!id || !full_name || !email) {
        res.status(400).send("Incomplete or wrong data about the admin.");
        return;
      }

      const result2 = await userDB.downgradeAdminToUser(id, full_name, email);

      if (result2.status === 0) {
        res
          .status(200)
          .send(`User ${full_name} (${email}) was downgraded successfully.`);
        return;
      }

      res
        .status(500)
        .send(
          `User ${full_name} (${email}) was NOT downgraded successfully. Something went wrong we are working on it.`
        );
    }
  )
);

router.put(
  "/downgradeMeToUser",
  adminAuth,
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      if (!req.admin) {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }

      const { id: downgradeeId } = req.admin;
      const { id, full_name, email } = req.admin;
      const status = await userDB.findOneAdmin(downgradeeId);

      if (status.status !== 0 || !status.rows) {
        res.status(400).send("Something went wrong. We are working on it.");
        return;
      }

      if (status.rows && status.rows.length === 0) {
        res.status(401).send(`No admin found for downgrading.`);
        return;
      }

      const result = await userDB.downgradeAdminToUser(id, full_name, email);

      if (result.status === 0) {
        res
          .status(200)
          .send(`User ${full_name} (${email}) was downgraded successfully.`);
        return;
      }

      res
        .status(500)
        .send(
          `User ${full_name} (${email}) was NOT downgraded successfully. Something went wrong we are working on it.`
        );
    }
  )
);

export default router;
