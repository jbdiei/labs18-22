import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path"
import { ValidRoutes } from "./shared/ValidRoutes";
import {fetchDataFromServer} from "./shared/ApiImageData";
import { ImageProvider,IApiImageData  } from "./ImageProvider";
import { connectMongo } from "./connectMongo";
import { registerImageRoutes } from "./routes/imageRoutes";
import { registerAuthRoutes } from "./routes/authRoutes";
import { CredentialsProvider } from "./CredentialsProvider";
import { verifyAuthToken } from "./verifyAuthToken";

dotenv.config(); // Read the .env file in the current working directory, and load values into process.env.

const PORT = process.env.PORT || 3000;
const STATIC_DIR = process.env.STATIC_DIR || "public";

async function startMongoConnection(){
  const mongoClient =connectMongo(); 
  try {
    await mongoClient.connect();
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }



const app = express();
// 4) Load JWT secret into app.locals for use in handlers
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("Missing JWT_SECRET in environment variables");
  }
  app.locals.JWT_SECRET = jwtSecret;

app.use(express.static(STATIC_DIR));

const staticPath = path.resolve(__dirname, "..", STATIC_DIR);
const imageProvider = new ImageProvider(mongoClient);

app.get("/api/hello", (req: Request, res: Response) => {
    res.send("Hello, World");
});

  app.use("/api/*", verifyAuthToken);
  
  registerImageRoutes(app, imageProvider);

  // Register your new auth routes
  const credsProv = new CredentialsProvider(mongoClient)
  registerAuthRoutes(app, credsProv);


app.get(Object.values(ValidRoutes), (req: Request, res: Response) => {
    res.sendFile("index.html", { root: staticPath });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

}
startMongoConnection().catch(err => {
  console.error("Error connecting to Mongo or listing collections:", err);
  process.exit(1);
});
