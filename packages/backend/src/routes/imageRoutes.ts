import express, { Request, Response }from "express";
import { MongoClient, Collection, ObjectId } from "mongodb";

import { ImageProvider, IApiImageData } from "../ImageProvider";


function waitDuration(numMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, numMs));
}


export function registerImageRoutes(app: express.Application, imageProvider: ImageProvider) {
    
    app.get("/api/images", async (req, res) => {
    await waitDuration(1000);
        try {
            // Extract the search query from query parameters
            const nameQuery = req.query.name;
            
            // Type guard to ensure it's a string (following your assignment hints)
            if (nameQuery !== undefined && typeof nameQuery !== "string") {
                res.status(400).json({
                    error: "Bad Request",
                    message: "Name parameter must be a single string value"
                });
                return;
            }
            
            // Console log the search query (as requested in assignment)
            if (nameQuery) {
                console.log(`User searching for images with name containing: "${nameQuery}"`);
            } else {
                console.log("User requesting all images (no search filter)");
            }
            
            // Call your existing method with optional filter
            const images = await imageProvider.getImages(nameQuery);
            
            res.json(images);
            
        } catch (error) {
            console.error("Error fetching images:", error);
            res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to fetch images"
            });
        }
    });

    app.patch("/api/images/:id", express.json(), async (req: Request, res: Response) => {
    // 1) Extract and validate ID
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(404).json({
        error: "Not Found",
        message: "Image does not exist",
      });
      return;
    }

    // 2) Ensure request body has exactly a "name" field
    if (!req.body || typeof req.body.name !== "string") {
      res.status(400).json({
        error: "Bad Request",
        message: "Request body must be { \"name\": \"newTitle\" } ",
      });
      return;
    }
    const newName: string = req.body.name.trim();

    // 3) (Optional) Enforce max‐length (e.g. 100 chars)
    const MAX_NAME_LENGTH = 100;
   
    if (newName.length > MAX_NAME_LENGTH) {
      res.status(422).json({
        error: "Unprocessable Entity",
        message: `Image name exceeds ${MAX_NAME_LENGTH} characters`,
      });
      return; 
    }

    // 4) Simulate a short delay so the client can show “Working…”
    await waitDuration(500);

    try {
      // 5) Call ImageProvider.updateImageName(...)
      const matchedCount = await imageProvider.updateImageName(id, newName);
      if (matchedCount === 0) {
        // No image with that ID was found
        res.status(404).json({
          error: "Not Found",
          message: "Image does not exist",
        });
        return;
      }
      // 6) On success, return 204 No Content
      res.status(204).send();
      return;
    } catch (err) {
      console.error("Error updating image name:", err);
      // If updateImageName threw “InvalidObjectId”, although we already checked .isValid,
      // this catch‐all covers any other failure modes.
      res.status(500).json({
        error: "Internal Server Error",
        message: "Could not update image name",
      });
    }
  });

  

}