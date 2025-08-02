import { type User, type InsertUser, type TerminalSession, type InsertTerminalSession, type FileSystemItem, type InsertFileSystemItem, type CommandResult } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Terminal session methods
  getTerminalSession(id: string): Promise<TerminalSession | undefined>;
  createTerminalSession(session: InsertTerminalSession): Promise<TerminalSession>;
  updateTerminalSession(id: string, updates: Partial<TerminalSession>): Promise<TerminalSession | undefined>;
  
  // File system methods
  getFileSystemItem(path: string): Promise<FileSystemItem | undefined>;
  getDirectoryContents(path: string): Promise<FileSystemItem[]>;
  createFileSystemItem(item: InsertFileSystemItem): Promise<FileSystemItem>;
  updateFileSystemItem(path: string, updates: Partial<FileSystemItem>): Promise<FileSystemItem | undefined>;
  deleteFileSystemItem(path: string): Promise<boolean>;
  fileSystemItemExists(path: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private terminalSessions: Map<string, TerminalSession>;
  private fileSystem: Map<string, FileSystemItem>;

  constructor() {
    this.users = new Map();
    this.terminalSessions = new Map();
    this.fileSystem = new Map();
    this.initializeFileSystem();
  }

  private initializeFileSystem() {
    // Create basic directory structure
    const now = new Date();
    const rootDirs = [
      { path: "/", name: "/", type: "directory", permissions: "drwxr-xr-x" },
      { path: "/home", name: "home", type: "directory", permissions: "drwxr-xr-x" },
      { path: "/home/user", name: "user", type: "directory", permissions: "drwxr-xr-x" },
      { path: "/home/user/Documents", name: "Documents", type: "directory", permissions: "drwxr-xr-x" },
      { path: "/home/user/Projects", name: "Projects", type: "directory", permissions: "drwxr-xr-x" },
    ];

    const files = [
      { path: "/home/user/.bashrc", name: ".bashrc", type: "file", content: "# .bashrc", permissions: "-rw-r--r--", size: "3526" },
      { path: "/home/user/.profile", name: ".profile", type: "file", content: "# .profile", permissions: "-rw-r--r--", size: "807" },
      { path: "/home/user/.bash_logout", name: ".bash_logout", type: "file", content: "# logout", permissions: "-rw-r--r--", size: "220" },
    ];

    [...rootDirs, ...files].forEach(item => {
      const fileItem: FileSystemItem = {
        id: randomUUID(),
        path: item.path,
        name: item.name,
        type: item.type as "file" | "directory",
        content: item.type === "file" ? (item as any).content : null,
        permissions: item.permissions,
        size: item.type === "file" ? (item as any).size : "4096",
        createdAt: now,
        updatedAt: now,
      };
      this.fileSystem.set(item.path, fileItem);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getTerminalSession(id: string): Promise<TerminalSession | undefined> {
    return this.terminalSessions.get(id);
  }

  async createTerminalSession(session: InsertTerminalSession): Promise<TerminalSession> {
    const id = randomUUID();
    const now = new Date();
    const terminalSession: TerminalSession = { 
      currentDirectory: "/home/user",
      commandHistory: [] as string[],
      userId: null,
      ...session, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.terminalSessions.set(id, terminalSession);
    return terminalSession;
  }

  async updateTerminalSession(id: string, updates: Partial<TerminalSession>): Promise<TerminalSession | undefined> {
    const session = this.terminalSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession: TerminalSession = { 
      ...session, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.terminalSessions.set(id, updatedSession);
    return updatedSession;
  }

  async getFileSystemItem(path: string): Promise<FileSystemItem | undefined> {
    return this.fileSystem.get(path);
  }

  async getDirectoryContents(path: string): Promise<FileSystemItem[]> {
    const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
    return Array.from(this.fileSystem.values()).filter(item => {
      const itemDir = item.path.substring(0, item.path.lastIndexOf('/')) || '/';
      return itemDir === normalizedPath && item.path !== normalizedPath;
    });
  }

  async createFileSystemItem(item: InsertFileSystemItem): Promise<FileSystemItem> {
    const id = randomUUID();
    const now = new Date();
    const fileItem: FileSystemItem = { 
      permissions: "-rw-r--r--",
      size: "0",
      content: null,
      ...item, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.fileSystem.set(item.path, fileItem);
    return fileItem;
  }

  async updateFileSystemItem(path: string, updates: Partial<FileSystemItem>): Promise<FileSystemItem | undefined> {
    const item = this.fileSystem.get(path);
    if (!item) return undefined;
    
    const updatedItem: FileSystemItem = { 
      ...item, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.fileSystem.set(path, updatedItem);
    return updatedItem;
  }

  async deleteFileSystemItem(path: string): Promise<boolean> {
    return this.fileSystem.delete(path);
  }

  async fileSystemItemExists(path: string): Promise<boolean> {
    return this.fileSystem.has(path);
  }
}

export const storage = new MemStorage();
