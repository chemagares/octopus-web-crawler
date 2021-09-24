export enum Actions {
  UPDATE_STATUS = "UPDATE_STATUS",
}

export interface UpdateRequestPayload {
  status: Status;
}

export enum Status {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  FAILED = "FAILED",
  DONE = "DONE",
}

export interface RequestItem {
  id: string;
  url: string;
  status: Status;
  from: string;
}

export interface UrlProperties {
  protocol?: string;
  base?: string;
  domain?: string;
}

export interface ScrapperOptions {
  url: string;
  maxRequest?: number;
  delay?: number;
  concurrency?: number;
  buffer?: boolean;
}

export interface RequestResult {
  url: string;
  content: any;
  buffer: Buffer;
}
