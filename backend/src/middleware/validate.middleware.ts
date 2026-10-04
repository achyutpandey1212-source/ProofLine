import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

interface RequestValidationSchemas {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export const validateRequest = (schemas: RequestValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as Request["query"];
      }
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as Request["params"];
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed.",
            details,
          },
        });
        return;
      }

      next(error);
    }
  };
};
