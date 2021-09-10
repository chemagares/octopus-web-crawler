export enum RequestActions {
  UPDATE_STATUS = "UPDATE_STATUS",
}

export interface UpdateRequestPayload {
  status: RequestStatus;
}

export enum RequestStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  FAILED = "FAILED",
  DONE = "DONE",
}

export interface RequestItem {
  id: string;
  url: string;
  status: RequestStatus;
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
}

export interface RequestResult {
  url: string;
  content: string;
}
