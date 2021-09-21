import {
  Actions,
  RequestItem,
  RequestResult,
  Status,
  ScrapperOptions,
  UpdateRequestPayload,
} from "./types";
import {
  createRequestItem,
  filterAlreadyAdded,
  filterExternalLinks,
  getBaseUrl,
  getUrlsFromHtml,
  removeLastSlashCharacter,
  removeWhiteSpaces,
} from "./utils";
const EventEmitter = require("events");
const http = require("http");
const https = require("https");

class Crawler extends EventEmitter {
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
  delay: number = 1000;

  /**
   * Requests array.
   */
  requests: Array<RequestItem> = [];

  /**
   * Time crawling started.
   */
  start: number = new Date().getTime();

  concurrency = 4;

  finishEventEmmited: boolean = false;

  constructor(opts: ScrapperOptions) {
    super();

    let { url, delay, maxRequest, concurrency } = opts;

    url = removeLastSlashCharacter(url);

    this.delay = delay;
    this.maxRequests = maxRequest;
    this.concurrency = concurrency;

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
    let todo = this.requests.filter((i) => i.status === Status.PENDING);

    let processing = this.requests.filter(
      (i) => i.status === Status.PROCESSING
    );

    const done = this.requests.filter((i) => i.status === Status.DONE);

    todo = todo.slice(0, this.concurrency - processing.length);

    todo.forEach((item) => {
      this.updateRequest(item, Actions.UPDATE_STATUS, {
        status: Status.PROCESSING,
      });
      this.processItem(item);
    });

    if (
      todo.length === 0 &&
      processing.length === 0 &&
      !this.finishEventEmmited
    ) {
      this.finishEventEmmited = true;
      this.emit("finish", { requests: this.requests });
    }
  };

  processItem = (item: RequestItem) => {
    const httpModule = item.url.includes("https") ? https : http;

    httpModule
      .get(item.url, (res: any) => {
        this.handleResponse(item, res);
      })
      .on("error", (err: any) => {
        this.updateRequest(item, Actions.UPDATE_STATUS, {
          status: Status.FAILED,
        });

        setTimeout(() => this.next(), this.delay);
      });
  };

  handleResponse(item: RequestItem, res: any) {
    const { statusCode } = res;

    const result: RequestResult = {
      url: item.url,
      content: "",
    };

    if (statusCode !== 301 && statusCode !== 200) {
      this.updateRequest(item, Actions.UPDATE_STATUS, {
        status: Status.FAILED,
      });
    } else if (statusCode === 301) {
      this.updateRequest(item, Actions.UPDATE_STATUS, {
        status: Status.PENDING,
      });
      const current = item.url.includes("https") ? "https" : "http";
      const newProtocol = item.url.includes("https") ? "http" : "https";

      this.changeProtocol(current, newProtocol);
      this.next();
    } else if (statusCode === 200) {
      res.setEncoding("utf8");

      res.on("data", (data: any) => (result.content += data));
    }

    res.on("end", () => {
      if (result.content !== "") {
        this.updateRequest(item, Actions.UPDATE_STATUS, {
          status: Status.DONE,
        });

        let data = removeWhiteSpaces(result.content);

        this.addUrls(item, data);

        this.emit("request", result);
      }
      setTimeout(() => this.next(), this.delay);
    });
  }

  changeProtocol = (current: string, newProtocol: string) => {
    this.baseUrl = this.baseUrl.replace(current, newProtocol);

    this.requests = this.requests.map((i) => {
      const newUrl = i.url.replace(current, newProtocol);
      return { ...i, url: newUrl };
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
    action: Actions,
    payload: UpdateRequestPayload
  ) => {
    switch (action) {
      case Actions.UPDATE_STATUS:
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

module.exports = Crawler;
