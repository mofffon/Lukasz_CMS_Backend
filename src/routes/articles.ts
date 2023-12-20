import express, { Response } from "express";
import IExtendedRequest from "../interfaces/IExtendedRequest";
import expressAsyncHandler from "express-async-handler";
import getDayIntervals from "../utils/getDayIntervals";
import * as validators from "./../services/validators";
import articleDB from "../services/articleDB";
import auth from "../middleware/auth";

const router = express.Router();

router.get(
  "/random",
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      const { from, to } = req.body;

      let startInterval;
      let endInterval;
      try {
        if (new Date(from).getTime() > new Date(to).getTime()) {
          throw new Error();
        }
        startInterval = getDayIntervals(new Date(from));
        endInterval = getDayIntervals(new Date(to));
      } catch (error) {
        res.status(400).send("The dates are incorrect");
        return;
      }

      const daysDiff = Math.round(
        (startInterval.startDate.getTime() - endInterval.endDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      console.log(daysDiff);
    }
  )
);

router.post(
  "/new",
  auth,
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }

      try {
        await validators.articleSchema.validateAsync(req.body);
      } catch (error: any) {
        res.status(400).send(error.message);
        return;
      }

      const { title, content, category } = req.body;

      const result = await articleDB.addOne(
        req.user.id,
        title,
        content,
        category
      );

      if (result.status === 0) {
        res.status(200).send("Article has been succesfully added");
        return;
      }

      res.status(500).send("Something went wrong. We are working on it.");
      return;
    }
  )
);

router.get(
  "/byUsername",
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      const { full_name } = req.body;

      if (!full_name || full_name.length < 3 || full_name.length > 512) {
        res
          .status(400)
          .send(
            "user full name is missing or the length is less than 3 or greater than 512."
          );
        return;
      }

      const result = await articleDB.findAllByUserFullName(full_name);
      if (result.status === 0) {
        res.status(200).send(result.rows);
        return;
      }

      res.status(500).send("Something went wrong. We are working on it.");
      return;
    }
  )
);

router.get(
  "/byCategory",
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      const { category } = req.body;

      if (!category) {
        res.status(400).send("Category is missing or is wrong.");
        return;
      }

      const result = await articleDB.findAllByCategory(category);
      if (result.status === 0) {
        res.status(200).send(result.rows);
        return;
      }

      res.status(500).send("Something went wrong. We are working on it.");
      return;
    }
  )
);

router.get(
  "/byUserFullNameAndCategory",
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      try {
        await validators.userFullNameAndCategorySchema.validateAsync(req.body);
      } catch (error: any) {
        res.status(400).send(error.message);
        return;
      }

      const { full_name, category } = req.body;

      const result = await articleDB.findAllByUserFullNameAndCategory(
        full_name,
        category
      );
      if (result.status === 0) {
        res.status(200).send(result.rows);
        return;
      }

      res.status(500).send("Something went wrong. We are working on it.");
      return;
    }
  )
);

router.get(
  "/",
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      const { article_id } = req.body;

      if (
        !article_id ||
        article_id < 0 ||
        article_id !== parseInt(article_id)
      ) {
        res.status(400).send("The article_id must be at least zero integer.");
        return;
      }

      const result = await articleDB.findById(article_id);
      if (result.status === 0) {
        res.status(200).send(result.rows);
        return;
      }

      res.status(500).send("Something went wrong. We are working on it.");
      return;
    }
  )
);

export default router;
