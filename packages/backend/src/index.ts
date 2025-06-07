import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import { ValidRoutes } from "./shared/ValidRoutes";
import { ImageProvider } from "./ImageProvider";
import { connectMongo } from "./connectMongo";
import { registerImageRoutes } from "./routes/imageRoutes";
import { registerAuthRoutes } from "./routes/authRoutes";
import { CredentialsProvider } from "./CredentialsProvider";
import { verifyAuthToken } from "./verifyAuthToken";
import { imageMiddlewareFactory, handleImageFileErrors } from "./imageUploadMiddleware";

dotenv.config();

const PORT = process.env.PORT || 3000;
const STATIC_DIR = process.env.STATIC_DIR || "public";
const UPLOAD_DIR = process.env.IMAGE_UPLOAD_DIR || "uploads";

async function start() {
  // 1) Connect to Mongo
  const mongoClient = connectMongo();
  try {
    await mongoClient.connect();
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Mongo connection failed:", err);
    process.exit(1);
  }

  // 2) Ensure upload directory exists
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const app = express();

  // 3) Load JWT secret
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("Missing JWT_SECRET in environment");
  }
  app.locals.JWT_SECRET = jwtSecret;

  // 4) Static file serving
  app.use(express.static(STATIC_DIR));
  // serve uploaded images
  app.use("/uploads", express.static(UPLOAD_DIR));

  // 5) Simple test endpoint
  app.get("/api/hello", (_req, res) => {
    res.send("Hello, World");
  });

  const imageProvider = new ImageProvider(mongoClient);
  registerImageRoutes(app, imageProvider);

  const credsProv = new CredentialsProvider(mongoClient);
  registerAuthRoutes(app, credsProv);

  // 7) Protect subsequent /api routes
  app.use("/api/*", verifyAuthToken);

  // 8) Other API routes

  
// 6) Image upload endpoint (no auth yet)
  app.post(
    "/api/images",
    imageMiddlewareFactory.single("image"),
    handleImageFileErrors,
    async (req: Request, res: Response) => {
      const file = req.file;
      const name = typeof req.body.name === "string" ? req.body.name.trim() : "";

      // a) validate file + title
      if (!file || !name) {
        res.status(400).json({
          error: "Bad Request",
          message: "Both image file and name are required",
        });
        return;
      }

      // b) ensure uploader identity
      const userId = req.user?.username as string | undefined;
      if (!userId) {
        res.status(401).end();
        return ;
      }

      // c) build public URL
      const src = `/uploads/${file.filename}`;

      // d) insert metadata
      try {
        const imageProvider = new ImageProvider(mongoClient);
        await imageProvider.createImage(src, name, userId);
        res.status(201).end();
        return ;
      } catch (err) {
        console.error("Error saving image metadata:", err);
        res.status(500).json({
          error: "Internal Server Error",
          message: "Could not save image metadata",
        });
        return; 
      }
    }
  );
  // 9) SPA fallback
  const staticPath = path.resolve(__dirname, "..", STATIC_DIR);
  app.get(Object.values(ValidRoutes), (_req, res) => {
    res.sendFile("index.html", { root: staticPath });
  });

  // 10) Start server
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}



start().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
