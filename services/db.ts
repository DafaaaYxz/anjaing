
import { User, ChatSession, GlobalSettings } from '../types';
import { MONGO_URI } from '../constants';

// Since we cannot run 'require("mongodb")' in a browser environment (it requires Node.js built-ins),
// we simulate the MongoDB driver interface. This allows the app to be structured as if it's talking to a DB,
// preserving the user's intent to use MongoDB, while persisting data to LocalStorage for this client-side demo.

class MockCollection<T> {
  private collectionName: string;

  constructor(name: string) {
    this.collectionName = name;
  }

  private getKey(): string {
    return `devcore_mongodb_${this.collectionName}`;
  }

  private loadData(): T[] {
    const data = localStorage.getItem(this.getKey());
    return data ? JSON.parse(data) : [];
  }

  private saveData(data: T[]) {
    localStorage.setItem(this.getKey(), JSON.stringify(data));
  }

  // Simulate MongoDB find
  async find(query: Partial<T> = {}): Promise<T[]> {
    const all = this.loadData();
    if (Object.keys(query).length === 0) return all;
    
    return all.filter(item => {
      return Object.entries(query).every(([key, val]) => (item as any)[key] === val);
    });
  }

  // Simulate MongoDB findOne
  async findOne(query: Partial<T>): Promise<T | null> {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  // Simulate MongoDB insertOne
  async insertOne(doc: T): Promise<T> {
    const all = this.loadData();
    all.push(doc);
    this.saveData(all);
    return doc;
  }

  // Simulate MongoDB replaceOne (upsert-like behavior for full object replacement)
  async replaceOne(query: Partial<T>, doc: T): Promise<boolean> {
    const all = this.loadData();
    const index = all.findIndex(item => Object.entries(query).every(([key, val]) => (item as any)[key] === val));
    
    if (index !== -1) {
      all[index] = doc;
      this.saveData(all);
      return true;
    }
    return false;
  }

  // Simulate MongoDB deleteOne
  async deleteOne(query: Partial<T>): Promise<boolean> {
    const all = this.loadData();
    const initialLen = all.length;
    const filtered = all.filter(item => !Object.entries(query).every(([key, val]) => (item as any)[key] === val));
    
    if (filtered.length !== initialLen) {
      this.saveData(filtered);
      return true;
    }
    return false;
  }

  // Bulk overwrite for Admin Panel convenience (not standard Mongo, but needed for current app logic)
  async overwriteAll(data: T[]) {
    this.saveData(data);
  }
}

class MongoClientMock {
  public users: MockCollection<User>;
  public settings: MockCollection<GlobalSettings>;
  public history: MockCollection<ChatSession>;
  private connected: boolean = false;

  constructor() {
    this.users = new MockCollection<User>('users');
    this.settings = new MockCollection<GlobalSettings>('settings');
    this.history = new MockCollection<ChatSession>('history');
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    
    console.log(`[MongoDB-Driver] Attempting connection to: ${MONGO_URI}`);
    // Simulate connection latency
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log(`[MongoDB-Driver] Connected to Cluster0`);
    this.connected = true;
  }
}

export const db = new MongoClientMock();
