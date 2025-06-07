import { MongoClient, Collection, ObjectId } from "mongodb";

export interface IImageDocument {
    _id: ObjectId;
    src: string;
    name: string;
    authorId: ObjectId;
}

export interface IApiImageData {
    id: string;
    src: string;
    name: string;
    author: {
        username: string;
    };
}

export class ImageProvider {
    private collection: Collection<IImageDocument>;

    constructor(private readonly mongoClient: MongoClient) {
        const collectionName = process.env.IMAGES_COLLECTION_NAME;
        if (!collectionName) {
            throw new Error("Missing IMAGES_COLLECTION_NAME from environment variables");
        }
        this.collection = this.mongoClient.db().collection(collectionName);
    }

    /**
     * Fetch images, optionally filtering by substring in the `name` field.
     * If no nameFilter is provided or it's empty, returns all images.
     * Uses aggregation to denormalize author.username.
     */
    public async getImages(nameFilter?: string): Promise<IApiImageData[]> {
        const pipeline: object[] = [];

        // Add a match stage only if nameFilter is a non-empty string
        if (nameFilter && nameFilter.trim() !== "") {
            pipeline.push({
                $match: { name: { $regex: new RegExp(nameFilter, "i") } }
            });
        }

        // Lookup to join with "users" collection
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "authorId",
                foreignField: "_id",
                as: "authorDoc"
            }
        });

        // Unwind the authorDoc array
        pipeline.push({
            $unwind: {
                path: "$authorDoc",
                preserveNullAndEmptyArrays: true
            }
        });

        // Project required fields and default missing username
        pipeline.push({
            $project: {
                _id: 1,
                name: 1,
                src: 1,
                "author.username": { $ifNull: ["$authorDoc.username", "Unknown"] }
            }
        });

        const cursor = this.collection.aggregate<IImageDocument & { author: { username: string } }>(pipeline);
        const docs = await cursor.toArray();

        return docs.map(doc => ({
            id: doc._id.toHexString(),
            name: doc.name,
            src: doc.src,
            author: { username: doc.author.username }
        }));
    }

    /**
     * Update an image's `name` field by its string-ID.
     */
    public async updateImageName(imageId: string, newName: string): Promise<number> {
        let _id: ObjectId;
        if (!ObjectId.isValid(imageId)) {
            throw new Error("InvalidObjectId");
        }
        _id = new ObjectId(imageId);
        const result = await this.collection.updateOne({ _id }, { $set: { name: newName } });
        return result.matchedCount;
    }
    public async getRawImageById(id: string): Promise<IImageDocument | null> {
    if (!ObjectId.isValid(id)) return null;
    return this.collection.findOne({ _id: new ObjectId(id) });
  }
}
