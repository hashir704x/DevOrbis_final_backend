export type roles = "user" | "admin" | "staff";
export type JwtPayload = {
  userId: string;
  role: roles;
};
export type Route = "rag" | "tasks" | "lead" | "general_talk";

export type RetrievedChunk = {
  id: number;
  documentId: string;
  content: string;
  source: {
    type: string;
    page: number | null;
    lines: {
      from: number | null;
      to: number | null;
    };
  };
};

export type RawRetrievedChunk = {
  id: number;
  document_id: string;
  chunk_text: string;
  metadata: {
    loc?: {
      pageNumber?: number;
      lines?: {
        from?: number;
        to?: number;
      };
    };
    source?: string;
  };
};
