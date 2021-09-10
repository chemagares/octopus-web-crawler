import {
  RequestActions,
  RequestItem,
  RequestResult,
  RequestStatus,
  ScrapperOptions,
  UpdateRequestPayload,
} from "./types";
import {
  createRequest,
  createRequestItem,
  filterAlreadyAdded,
  filterExternalLinks,
  getBaseUrl,
  getUrlsFromHtml,
  removeLastSlashCharacter,
  removeWhiteSpaces,
} from "./utils";
const EventEmitter = require("events");

const iconv = require("iconv-lite");

export class Scrapper extends EventEmitter {
  /**
   * Base url.
   */
  baseUrl: string;

  /**
   * Main url domain.
   */
  domain: string;

  /**
   * Max allowed requests.
   */
  maxRequests: number = 100;

  /**
   * Delay.
   */
  delay: number = 100;

  /**
   * Requests array.
   */
  requests: Array<RequestItem> = [];

  /**
   * Time crawling started.
   */
  start: number = new Date().getTime();

  constructor(opts: ScrapperOptions) {
    super();

    let { url, delay, maxRequest } = opts;

    url = removeLastSlashCharacter(url);

    this.delay = delay;
    this.maxRequests = maxRequest;

    const props = getBaseUrl(url);

    if (props.base === null || props.domain === null) {
      throw new Error("The url provided is not valid");
    }

    this.baseUrl = props.base;
    this.domain = props.domain;
    const r = createRequestItem(url);
    this.requests.push(r);

    this.next();
  }

  next = (): void => {
    const todo = this.requests.filter(
      (i) => i.status === RequestStatus.PENDING
    );

    if (todo.length === 0) {
      console.log("All items have been processed.");
      console.log(
        `Made ${this.requests.length} request in ${
          (new Date().getTime() - this.start) / 1000
        } seconds.`
      );

      this.emit("finish", { requests: this.requests });

      return;
    }

    this.processItem(todo[0]);
  };

  processItem = (item: RequestItem) => {
    // console.table(this.requests);
    // console.log(`Processing ${item.url}`);
    const req: Promise<any> = createRequest(item.url);
    req
      .then((data: string) => {
        data = iconv.decode(data, "win1252");

        const res: RequestResult = {
          url: item.url,
          content: data,
        };

        this.emit("request", res);

        data = removeWhiteSpaces(data);

        this.updateRequest(item, RequestActions.UPDATE_STATUS, {
          status: RequestStatus.DONE,
        });

        if (this.requests.length >= this.maxRequests) return;

        this.addUrls(item, data);
      })
      .catch(() => {
        this.updateRequest(item, RequestActions.UPDATE_STATUS, {
          status: RequestStatus.FAILED,
        });
      })
      .finally(() => {
        setTimeout(() => this.next(), this.delay);
      });
  };

  addUrls = (item: RequestItem, html: string) => {
    let links = getUrlsFromHtml(html);
    links = [...new Set(links)];

    // Make urls absolute
    let news: Array<string> = this.getAbsoluteUrls(links);

    // Remove external
    news = filterExternalLinks(news, this.baseUrl);

    // Remove already processed
    news = filterAlreadyAdded(news, this.requests);

    // Create request items
    const items = news.map((i: string) => createRequestItem(i, item.id));

    // Count remaining requests
    const remaining = this.maxRequests - this.requests.length;

    // Add remaining requests to queqe
    this.requests = [...this.requests, ...items.slice(0, remaining)];
  };

  getAbsoluteUrls = (links: Array<string>) => {
    return links.map((link: string) => {
      const isAbsolute = link.includes("http");
      link = isAbsolute ? link : link.replace(/^\//g, "");
      return isAbsolute ? link : `${this.baseUrl}/${link}`;
    });
  };

  updateRequest = (
    item: RequestItem,
    action: RequestActions,
    payload: UpdateRequestPayload
  ) => {
    switch (action) {
      case RequestActions.UPDATE_STATUS:
        const idx = this.findRequestIndex(item);

        const update = {
          ...item,
          status: payload.status,
        };

        this.requests[idx] = update;

        break;
    }
  };

  findRequestIndex = (req: RequestItem) => {
    return this.requests.findIndex((i: RequestItem) => i.id === req.id);
  };
}
