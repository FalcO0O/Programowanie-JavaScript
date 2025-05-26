import { MongoClient } from "npm:mongodb@6.1.0";
import { Student } from "./models.ts";
import type { Collection } from "npm:mongodb";

export class DatabaseService {
  private client: MongoClient;
  private _studentsCollection!: Collection<Student>;

  constructor(private uri: string, private dbName: string, private collectionName: string) {
    this.client = new MongoClient(uri);
  }

  async connect(): Promise<void> {
    await this.client.connect();
    const db = this.client.db(this.dbName);
    this._studentsCollection = db.collection<Student>(this.collectionName);
  }

  get studentsCollection() {
    return this._studentsCollection;
  }
}
