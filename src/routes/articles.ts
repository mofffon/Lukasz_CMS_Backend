import express, { Response, Request } from "express";
import IExtendedRequest from "../interfaces/IExtendedRequest";
import expressAsyncHandler from "express-async-handler";
import getDayIntervals from "../utils/getDayIntervals";
import * as validators from "./../services/validators";
import articleDB from "../services/articleDB";
import auth from "../middleware/auth";

const router = express.Router();

type ReqDictionary = {};
type ReqBody = { from: Date; to: Date };
type ReqQuery = { from: Date; to: Date };
type ResBody = { from: Date; to: Date };

type HandlerRequest = Request<ReqDictionary, ReqBody, ReqQuery, ResBody>;

router.get(
  "/byId",
  expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { articleId } = req.query;

    const parsed = parseInt(articleId as string);
    if (!parsed || parsed < 0) {
      res.status(400).send("Article id must be a non negative integer.");
      return;
    }

    const result = await articleDB.findById(parsed);

    if (result.status > 0) {
      res.status(500).send("Something went wrong. We are working on it.");
      return;
    }

    if (result.status === 0 && result.rows && result.rows.length > 0) {
      res.status(200).send(result.rows);
      return;
    }

    res.status(200).send("There was no data found.");
  })
);

router.get(
  "/newest",
  expressAsyncHandler(
    async (req: HandlerRequest, res: Response): Promise<void> => {
      console.log(req);
      const result = await articleDB.findNewestArticle();

      if (result.status > 0) {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }

      if (result.status === 0 && result.rows && result.rows.length > 0) {
        res.status(200).send(result.rows);
        return;
      }

      res.status(200).send("There was no data found.");
    }
  )
);

router.get(
  "/random",
  expressAsyncHandler(
    async (req: HandlerRequest, res: Response): Promise<void> => {
      const { from, to } = req.query;

      let startInterval;
      let endInterval;
      try {
        if (!from || !to || new Date(from).getTime() > new Date(to).getTime()) {
          throw new Error();
        }
        startInterval = getDayIntervals(new Date(from));
        endInterval = getDayIntervals(new Date(to));
      } catch (error) {
        res.status(400).send("The dates are incorrect");
        return;
      }

      const result = await articleDB.find100Random(
        startInterval.startDate,
        endInterval.endDate
      );

      if (result.status > 0) {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }

      if (!result.rows || result.rows.length === 0) {
        res.status(200).send("There are no articles for this timeline.");
        return;
      }

      const selectedArticle =
        result.rows[Math.floor(result.rows.length * Math.random())];

      res.status(200).send(selectedArticle);
      return;
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
      const { full_name } = req.query;

      if (!full_name || !full_name.length) {
        res
          .status(400)
          .send(
            "user full name is missing or the length is less than 3 or greater than 512."
          );
        return;
      }

      const result = await articleDB.listAllByUserFullName(full_name as string);
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
  expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { category } = req.query;

    if (!category) {
      res.status(400).send("Category is missing or is wrong.");
      return;
    }

    const result = await articleDB.findAllByCategory(category as string);
    if (result.status === 0) {
      res.status(200).send(result.rows);
      return;
    }

    res.status(500).send("Something went wrong. We are working on it.");
    return;
  })
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
  "/byTitle",
  expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { title } = req.query;

    if (!title || typeof title !== "string") {
      res.status(400).send("Title must be an non empty string");
      return;
    }

    const result = await articleDB.findAllByTitle(title as string);

    if (result.status === 0) {
      res.status(200).send(result.rows);
      return;
    }

    res.status(500).send("Something went wrong. We are working on it.");
    return;
  })
);

router.get(
  "/byTitleAndCategory",
  expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { title, category } = req.query;

    if (!title || !category) {
      res.status(400).send("Title and category must be non empty strings");
    }

    const result = await articleDB.findByTitleAndCategory(
      title as string,
      category as string
    );

    if (result.status > 0) {
      res.status(500).send("Something went wrong. We are working on it.");
      return;
    }

    res.status(200).send(result.rows);
  })
);

router.patch(
  "/update",
  auth,
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      const { id, title, category, content } = req.body;

      try {
        validators.articleSchema.validate({ title, category, content });
      } catch (error: any) {
        console.log(error);
        res.status(400).send(error.message);
        return;
      }

      const parsedId = parseInt(id as string);
      if (!id || parsedId < 0) {
        res.status(400).send("The id must be an integer.");
        return;
      }

      const result = await articleDB.updateArticle(
        parsedId,
        title as string,
        category as string,
        content as string[]
      );

      if (result.status > 0) {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }

      res.status(200).send(result.rows);
    }
  )
);

router.delete(
  "/delete",
  auth,
  expressAsyncHandler(
    async (req: IExtendedRequest, res: Response): Promise<void> => {
      const { id } = req.body;

      const parsedId = parseInt(id);

      if (!parsedId || parsedId < 0) {
        res.status(400).send("The id must be a non negative integer.");
        return;
      }

      const result = await articleDB.deleteArticle(id);

      if (result.status > 0) {
        res.status(500).send("Something went wrong. We are working on it.");
        return;
      }

      res.status(200).send(result.rows);
    }
  )
);

export default router;
