import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    pgEnum,
    integer,
    jsonb,
    vector,
    serial,
    bigint,
    decimal,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "staff", "user"]);
export const documentStatusEnum = pgEnum("document_status", [
    "processing",
    "success",
    "failed",
]);
export const messageFromEnum = pgEnum("message_from", ["Human", "Ai"]);
export const taskStatusEnum = pgEnum("task_status", [
    "pending",
    "in_progress",
    "completed",
]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high"]);

export const aiUsageTypeEnum = pgEnum("ai_usage_type", ["llm", "embedding"]);

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    username: varchar("username", { length: 50 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password").notNull(),
    role: userRoleEnum("role").notNull().default("user"),
    isVerified: boolean("is_verified").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const otpCodes = pgTable("otp_codes", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    otp: varchar("otp", { length: 6 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documents = pgTable("documents", {
    id: uuid("id").defaultRandom().primaryKey(),
    filename: varchar("filename", { length: 255 }).notNull(),
    storageKey: text("storage_key").notNull(),
    fileUrl: text("file_url").notNull(),
    fileType: varchar("file_type", { length: 120 }).notNull(),
    fileSize: integer("file_size").notNull(),
    uploadedBy: uuid("uploaded_by")
        .notNull()
        .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    status: documentStatusEnum("status").notNull().default("processing"),
});

export const documentChunks = pgTable("document_chunks", {
    id: serial("id").primaryKey(),
    documentId: uuid("document_id")
        .notNull()
        .references(() => documents.id, { onDelete: "cascade" }),
    chunkText: text("chunk_text").notNull(),
    metadata: jsonb("metadata").notNull(),
    embedding: vector("embedding", {
        dimensions: 1536,
    }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chats = pgTable("chats", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});

export const messages = pgTable("messages", {
    id: serial("id").primaryKey(),
    chatId: uuid("chat_id")
        .notNull()
        .references(() => chats.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    from: messageFromEnum("from").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});

export const leads = pgTable("leads", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .unique()
        .references(() => users.id, { onDelete: "cascade" }),
    budget: text("budget").notNull(),
    projectDescription: text("project_description").notNull(),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
});

export const tasks = pgTable("tasks", {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: taskStatusEnum("status").notNull().default("pending"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    assignedTo: uuid("assigned_to")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id")
        .notNull()
        .references(() => leads.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
});

export const aiUsage = pgTable("ai_usage", {
    id: serial("id").primaryKey(),
    type: aiUsageTypeEnum("type").notNull(),
    inputTokens: bigint("input_tokens", {
        mode: "number",
    }).notNull(),
    outputTokens: bigint("output_tokens", {
        mode: "number",
    }),
    totalTokens: bigint("total_tokens", {
        mode: "number",
    }).notNull(),
    cost: decimal("cost", {
        precision: 12,
        scale: 8,
    }).notNull(),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
});
