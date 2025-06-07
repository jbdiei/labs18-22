// backend/src/imageUploadMiddleware.ts
import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

export class ImageFormatError extends Error {}

const storageEngine = multer.diskStorage({
  destination(req: Request, file, cb) {
    const uploadDir = process.env.IMAGE_UPLOAD_DIR;
    if (!uploadDir) {
      throw new Error("Missing IMAGE_UPLOAD_DIR environment variable");
    }
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },

  filename(req: Request, file, cb) {
    // 1) figure out extension from mimetype
    let ext: string;
    switch (file.mimetype) {
      case "image/png":
        ext = "png";
        break;
      case "image/jpeg":
      case "image/jpg":
        ext = "jpg";
        break;
      default:
        return cb(new ImageFormatError("Unsupported image type"), "");
    }

    // 2) generate a random filename to avoid collisions
    const fileName = Date.now() + "-" + Math.round(Math.random() * 1E9) + "." + ext;


    cb(null, fileName);
  },
});

export const imageMiddlewareFactory = multer({
  storage: storageEngine,
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter(req, file, cb) {
    // optionally enforce extension by file.originalname too,
    // but our filename() already restricts by mimetype
    cb(null, true);
  },
});

export function handleImageFileErrors(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof multer.MulterError || err instanceof ImageFormatError) {
    res.status(400).json({
      error: "Bad Request",
      message: err.message,
    });
    return;
  }
  next(err);
}
