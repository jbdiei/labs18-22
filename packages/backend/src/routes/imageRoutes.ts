import express, { Request, Response }from "express";
import { MongoClient, Collection, ObjectId } from "mongodb";

import { ImageProvider, IApiImageData } from "../ImageProvider";

    
    
// Helper to simulate delay
function waitDuration(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
    

export function registerImageRoutes(
  app: express.Application,
  imageProvider: ImageProvider
) {
  // GET /api/images → return all images
  app.get("/api/images", async (_req: Request, res: Response) => {
    await waitDuration(Math.random()*5000);
    try {
      const allImages = await imageProvider.getImages();
      res.json(allImages);
      return;
    } catch (err) {
      console.error("Error fetching images:", err);
      res.status(500).json({ error: "Failed to fetch images" });
      return;
    }
  });

  // GET /api/images/search?name=... → search by name
  app.get("/api/images/search", async (req: Request, res: Response) => {
    const rawName = req.query.name;
    if (typeof rawName !== "string") {
      res.status(400).json({
        error: "Bad Request",
        message: "Name query parameter is required and must be a string",
      });
      return;
    }
    try {
      const images = await imageProvider.getImages(rawName);
      res.json(images);
      return;
    } catch (error) {
      console.error("Error searching images:", error);
      res.status(500).json({
        error: "Failed to search images",
      });
      return;
    }
  });

  // PATCH /api/images/:id → update image name if owner matches
  app.patch(
    "/api/images/:id",
    express.json(),
    async (req: Request, res: Response) => {
      const imageId = req.params.id;
      // Validate ObjectId
      if (!ObjectId.isValid(imageId)) {
        res.status(404).json({
          error: "Not Found",
          message: "Image does not exist",
        });
        return;
      }

      // Ensure body contains a valid name
      if (!req.body || typeof req.body.name !== 'string') {
        res.status(400).json({
          error: "Bad Request",
          message: "Request body must be { \"name\": \"newTitle\" }",
        });
        return;
      }
      const newName: string = req.body.name.trim();

      const MAX_NAME_LENGTH = 100;
      if (newName.length === 0) {
        res.status(400).json({
          error: "Bad Request",
          message: "Name must be a non-empty string",
        });
        return;
      }
      if (newName.length > MAX_NAME_LENGTH) {
        res.status(422).json({
          error: "Unprocessable Entity",
          message: `Image name exceeds ${MAX_NAME_LENGTH} characters`,
        });
        return;
      }

      // Simulate a short delay so the client can show “Working…”
      await waitDuration(500);

      try {
        // Retrieve denormalized images and find the one we're updating
        const allImages: IApiImageData[] = await imageProvider.getImages();
        const image = allImages.find((img) => img.id === imageId);
        if (!image) {
          res.status(404).json({
            error: "Not Found",
            message: "Image does not exist",
          });
          return;
        }

        // Ensure the logged-in user is the author
        const loggedInUsername = req.user?.username;
        if (image.author.username !== loggedInUsername) {
          res.status(403).json({
            error: "Forbidden",
            message: "You do not have permission to modify this image",
          });
          return;
        }

        // Perform the update
        const matchedCount = await imageProvider.updateImageName(
          imageId,
          newName
        );
        if (matchedCount === 0) {
          res.status(404).json({
            error: "Not Found",
            message: "Image does not exist",
          });
          return;
        }
        res.status(204).send();
        return;
      } catch (err) {
        console.error("Error updating image name:", err);
        res.status(500).json({
          error: "Internal Server Error",
          message: "Failed to update image name",
        });
        return;
      }
    }
  );
}

