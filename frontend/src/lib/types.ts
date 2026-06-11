export interface Document {
  id: string;
  name: string;
  size: number;
  chunks: number;
  uploaded_at: string;
}

export interface SourcePassage {
  content: string;
  source?: string;
  page?: number | null;
  chunk_index: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourcePassage[];
  streaming?: boolean;
  timestamp: number; // Date.now()
}
