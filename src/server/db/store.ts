import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface CollectionData {
  users: any[];
  assets: any[];
  contents: any[];
  categories: any[];
  tags: any[];
  roles: any[];
  access_requests: any[];
  shares: any[];
  notifications: any[];
  audit_logs: any[];
  password_reset_tokens: any[];
  system_settings: any[];
}

const initialDb: CollectionData = {
  users: [],
  assets: [],
  contents: [],
  categories: [],
  tags: [],
  roles: [],
  access_requests: [],
  shares: [],
  notifications: [],
  audit_logs: [],
  password_reset_tokens: [],
  system_settings: []
};

class JsonDocumentStore {
  private cache: CollectionData | null = null;

  private load(): CollectionData {
    if (this.cache) return this.cache;
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.cache = { ...initialDb, ...JSON.parse(raw) };
      } else {
        this.cache = { ...initialDb };
        this.save();
      }
    } catch (e) {
      console.error('Error reading db.json, initializing fresh store:', e);
      this.cache = { ...initialDb };
    }
    return this.cache!;
  }

  private save(): void {
    if (!this.cache) return;
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.cache, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (e) {
      console.error('Error saving db.json:', e);
    }
  }

  public getCollection<T = any>(name: keyof CollectionData): CollectionOps<T> {
    return new CollectionOps<T>(this, name);
  }

  public _getRawData(): CollectionData {
    return this.load();
  }

  public _persist(): void {
    this.save();
  }
}

export class CollectionOps<T = any> {
  constructor(private store: JsonDocumentStore, private colName: keyof CollectionData) {}

  private getItems(): T[] {
    const data = this.store._getRawData();
    if (!data[this.colName]) {
      data[this.colName] = [];
    }
    return data[this.colName];
  }

  public find(query: Partial<T> | ((item: T) => boolean) = {}): T[] {
    const items = this.getItems();
    if (typeof query === 'function') {
      return items.filter(query);
    }
    return items.filter(item => {
      for (const key of Object.keys(query)) {
        if ((item as any)[key] !== (query as any)[key]) {
          return false;
        }
      }
      return true;
    });
  }

  public findOne(query: Partial<T> | ((item: T) => boolean) = {}): T | null {
    const results = this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  public findById(id: string): T | null {
    return this.findOne({ _id: id } as any);
  }

  public create(doc: Omit<T, '_id' | 'createdAt' | 'updatedAt'> & { _id?: string }): T {
    const items = this.getItems();
    const now = new Date().toISOString();
    const newDoc: any = {
      _id: doc._id || crypto.randomUUID(),
      ...doc,
      createdAt: (doc as any).createdAt || now,
      updatedAt: (doc as any).updatedAt || now
    };
    items.push(newDoc);
    this.store._persist();
    return newDoc as T;
  }

  public findByIdAndUpdate(id: string, updates: Partial<T>): T | null {
    const items = this.getItems();
    const index = items.findIndex((item: any) => item._id === id);
    if (index === -1) return null;

    const existing = items[index];
    const updated = {
      ...existing,
      ...updates,
      _id: id,
      updatedAt: new Date().toISOString()
    };
    items[index] = updated;
    this.store._persist();
    return updated;
  }

  public findByIdAndDelete(id: string): T | null {
    const items = this.getItems();
    const index = items.findIndex((item: any) => item._id === id);
    if (index === -1) return null;

    const removed = items.splice(index, 1)[0];
    this.store._persist();
    return removed;
  }

  public count(query: Partial<T> | ((item: T) => boolean) = {}): number {
    return this.find(query).length;
  }

  public deleteMany(query: Partial<T> | ((item: T) => boolean)): number {
    const items = this.getItems();
    const toKeep = typeof query === 'function' 
      ? items.filter(item => !query(item))
      : items.filter(item => {
          for (const key of Object.keys(query)) {
            if ((item as any)[key] === (query as any)[key]) return false;
          }
          return true;
        });
    const deletedCount = items.length - toKeep.length;
    (this.store._getRawData()[this.colName] as any) = toKeep;
    this.store._persist();
    return deletedCount;
  }
}

export const dbStore = new JsonDocumentStore();
