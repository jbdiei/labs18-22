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
  app.get("/api/images", async (req: Request, res: Response) => {
    await waitDuration(Math.random() * 5000);

    // 1) Read the optional `name` query‐param
    const rawName = req.query.name;
    if (rawName !== undefined && typeof rawName !== "string") {
      res.status(400).json({
        error: "Bad Request",
        message: "`name` query parameter must be a string",
      });
      return;
    }

    try {
      // 2) Fetch images, passing nameFilter if provided
      const images: IApiImageData[] =
        typeof rawName === "string"
          ? await imageProvider.getImages(rawName)
          : await imageProvider.getImages();

      res.json(images);
      return ;
    } catch (err) {
      console.error("Error fetching images:", err);
      res.status(500).json({ error: "Failed to fetch images" });
      return ;
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
      if (!req.body || typeof req.body.name !== "string") {
        res.status(400).json({
          error: "Bad Request",
          message: 'Request body must be { "name": "newTitle" }',
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
        // Fetch the raw document (with authorId) so we can check ownership
        const rawDoc = await imageProvider.getRawImageById(imageId);
        if (!rawDoc) {
          res.status(404).json({
            error: "Not Found",
            message: "Image does not exist",
          });
          return;
        }

        // Compare authorId to logged-in user’s ID (in your JWT you must have set userId)
        const loggedInUserId = req.user?.username as string ;
        
        const rawAuthor = rawDoc.authorId.toString() 
       
        if (rawAuthor !== loggedInUserId) {
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

