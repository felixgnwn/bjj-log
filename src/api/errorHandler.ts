import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../core/errors.js";

// Express body-parser errors (like malformed JSON) carry a 4xx "status"
function clientErrorStatus(err: unknown): number | null {
  if (typeof err === "object" && err !== null && "status" in err) {
    const status = (err as { status: unknown }).status;

    if (typeof status === "number" && status >= 400 && status < 500) {
      return status;
    }
  }

  return null;
}

// Express treats a function with exactly four parameters as an error handler,
// so _next must stay even though it's unused
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }

  const status = clientErrorStatus(err);

  if (status !== null) {
    res.status(status).json({ error: "Bad request" });
    return;
  }

  // req.log already carries this request's id, so the line can be traced
  req.log.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
}
