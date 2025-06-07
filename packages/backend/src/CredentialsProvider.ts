import { MongoClient, Collection } from "mongodb";
import bcrypt from "bcrypt";

/**
 * Document schema for credentials: username as primary key, plus bcrypt-hashed password.
 */
export interface ICredentialDocument {
  _id: string;       // username serves as the document _id
  username: string;
  password: string;  // bcrypt hash (includes salt)
}

export class CredentialsProvider {
  private readonly collection: Collection<ICredentialDocument>;

  constructor(private readonly mongoClient: MongoClient) {
    const collectionName = process.env.CREDS_COLLECTION_NAME;
    if (!collectionName) {
      throw new Error("Missing CREDS_COLLECTION_NAME from environment variables");
    }
    this.collection = this.mongoClient.db().collection(collectionName);
  }

  /**
   * Register a new user with the given username and plaintext password.
   * Returns true if registration succeeded, false if the username already exists.
   */
  public async registerUser(username: string, plaintextPassword: string): Promise<boolean> {
    // 1) Check if user already exists
    const existing = await this.collection.findOne({ _id: username });
    if (existing) {
      return false;
    }

    // 2) Generate a salt and hash the password
    const saltRounds = 10;
    const hashed = await bcrypt.hash(plaintextPassword, saltRounds);

    // 3) Insert credentials document (bcrypt hash includes the salt)
    await this.collection.insertOne({
      _id: username,
      username,
      password: hashed
    });

    return true;
  }

  /**
   * Verify a candidate password for the given username.
   * Returns true if the password matches, false otherwise (or if user not found).
   */
  public async verifyPassword(username: string, plaintextPassword: string): Promise<boolean> {
    // 1) Look up credentials by username
    const creds = await this.collection.findOne({ _id: username });
    if (!creds) {
      return false;
    }

    // 2) Compare plaintext candidate with stored bcrypt hash
    const match = await bcrypt.compare(plaintextPassword, creds.password);
    return match;
  }
}
