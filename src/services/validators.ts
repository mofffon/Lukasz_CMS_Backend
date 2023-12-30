import Joi from "Joi";

export const userSchema = Joi.object({
  full_name: Joi.string().min(3).max(512).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(3).max(512).required(),
});

export const id = Joi.object({
  id: Joi.number().integer().min(0).required(),
});

export const emailUpdateSchema = Joi.object({
  old_email: Joi.string().email().required(),
  new_email: Joi.string().email().required(),
});

export const passwordUpdateSchema = Joi.object({
  old_password: Joi.string().min(3).max(512).required(),
  new_password: Joi.string().min(3).max(512).required(),
});

export const adminSchema = Joi.object({
  full_name: Joi.string().min(3).max(512).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(3).max(512).required(),
});

export const articleSchema = Joi.object({
  title: Joi.string().required(),
  content: Joi.array().items(Joi.string()).required(),
  category: Joi.string().required(),
});

export const userFullNameAndCategorySchema = Joi.object({
  full_name: Joi.string().min(3).max(512).required(),
  category: Joi.string().min(3).max(512).required(),
});
