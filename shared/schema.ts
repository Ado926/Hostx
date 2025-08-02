import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const terminalSessions = pgTable("terminal_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  currentDirectory: text("current_directory").notNull().default("/home/user"),
  commandHistory: jsonb("command_history").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const fileSystem = pgTable("file_system", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  path: text("path").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'file' or 'directory'
  content: text("content"), // null for directories
  permissions: text("permissions").notNull().default("rw-r--r--"),
  size: text("size").notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTerminalSessionSchema = createInsertSchema(terminalSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFileSystemSchema = createInsertSchema(fileSystem).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type TerminalSession = typeof terminalSessions.$inferSelect;
export type InsertTerminalSession = z.infer<typeof insertTerminalSessionSchema>;
export type FileSystemItem = typeof fileSystem.$inferSelect;
export type InsertFileSystemItem = z.infer<typeof insertFileSystemSchema>;

// Command execution types
export type CommandResult = {
  output: string;
  error?: string;
  currentDirectory: string;
  success: boolean;
};

export type SystemResources = {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  processes: number;
  uptime: number;
};

export type FileManagerItem = {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: Date;
  permissions: string;
  owner: string;
  group: string;
};

export type WebSocketMessage = {
  type: 'command' | 'result' | 'error' | 'connect' | 'disconnect' | 'resources' | 'file_manager';
  command?: string;
  result?: CommandResult;
  error?: string;
  sessionId?: string;
  resources?: SystemResources;
  fileManager?: {
    action: 'list' | 'create' | 'delete' | 'rename' | 'move' | 'copy';
    path?: string;
    data?: FileManagerItem[];
  };
};
