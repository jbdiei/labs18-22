import { MongoClient, Collection, ObjectId, InsertOneResult  } from "mongodb";

export interface IImageDocument {
    _id: ObjectId;
    src: string;
    name: string;
    authorId: string;
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
    // Optional name filtering:
    const filter = nameFilter && nameFilter.trim() !== ""
      ? { name: { $regex: new RegExp(nameFilter, "i") } }
      : {};
    const docs = await this.collection.find(filter).toArray();

    // Map into exactly what the frontend needs
    return docs.map(doc => ({
      id: doc._id.toString(),
      src: doc.src,
      name: doc.name,
      // here we “fake” the user object
      author: {
        username: doc.authorId.toString()
      }
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

  public async createImage(
    src: string,
    name: string,
    authorId: string
  ): Promise<string> {
    // const authorObjId = new ObjectId(authorId);
    const newId = new ObjectId();

    const result: InsertOneResult<IImageDocument> =
      await this.collection.insertOne({_id: newId, src, name, authorId });

    return result.insertedId.toString();
  }
}

