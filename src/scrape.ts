import {
  RequestActions,
  RequestItem,
  RequestStatus,
  UpdateRequestPayload,
} from "./types";
import {
  createRequest,
  createRequestItem,
  filterAlreadyAdded,
  filterExternalLinks,
  getBaseUrl,
  getLinks,
  removeWhiteSpaces,
  save,
} from "./utils";

const iconv = require("iconv-lite");

export class Scrapper {
  MAIN_URL: string;
  BASE_URL: string;
  DOMAIN: string;
  MAX_REQUEST: number;
  DELAY: number;

  callback: Function;
  finishCb: Function;

  REQUESTS: Array<RequestItem> = [];

  start: number;

  constructor(
    url: string,
    maxRequest?: number,
    delay?: number,
    callback?: Function,
    finishCb?: Function
  ) {
    this.DELAY = delay || 100;
    this.MAX_REQUEST = maxRequest || 100;
    this.MAIN_URL = url.match(/\/$/) ? url.slice(0, -1) : url;

    this.callback = callback;
    this.finishCb = finishCb;

    this.start = new Date().getTime();

    const props = getBaseUrl(this.MAIN_URL);

    if (props.base && props.domain) {
      this.BASE_URL = props.base;
      this.DOMAIN = props.domain;
      const r = createRequestItem(this.MAIN_URL);
      this.REQUESTS.push(r);

      this.next();
    } else {
      console.log("The url provided is not valid");
    }
  }

  next = (): void => {
    const todo = this.REQUESTS.filter(
      (i) => i.status === RequestStatus.PENDING
    );

    if (todo.length === 0) {
      console.log("All items have been processed.");
      console.log(
        `Made ${this.REQUESTS.length} request in ${
          (new Date().getTime() - this.start) / 1000
        } seconds.`
      );

      if (this.finishCb) this.finishCb();

      return;
    }

    this.processItem(todo[0]);
  };

  processItem = (item: RequestItem) => {
    console.table(this.REQUESTS);
    // console.log(`Processing ${item.url}`);
    const req: Promise<any> = createRequest(item.url);
    req
      .then((data: string) => {
        data = iconv.decode(data, "win1252");

        if (this.callback) this.callback(data);

        data = removeWhiteSpaces(data);

        this.updateRequest(item, RequestActions.UPDATE_STATUS, {
          status: RequestStatus.DONE,
        });

        if (this.REQUESTS.length >= this.MAX_REQUEST) return;

        this.addNewLinks(item, data);
      })
      .catch(() => {
        this.updateRequest(item, RequestActions.UPDATE_STATUS, {
          status: RequestStatus.FAILED,
        });
      })
      .finally(() => {
        setTimeout(() => this.next(), this.DELAY);
      });
  };

  addNewLinks = (item: RequestItem, html: string) => {
    let links = getLinks(html);

    links = [...new Set(links)];

    let news: Array<string> = links.map((l: string) => {
      const isAbsolute = l.includes("http");
      l = isAbsolute ? l : l.replace(/^\//g, "");
      return isAbsolute ? l : `${this.BASE_URL}/${l}`;
    });

    news = filterExternalLinks(news, this.BASE_URL);

    news = filterAlreadyAdded(news, this.REQUESTS);

    const items = news.map((i: string) => createRequestItem(i, item.id));

    const remainingRequest = this.MAX_REQUEST - this.REQUESTS.length;
    this.REQUESTS = [...this.REQUESTS, ...items.slice(0, remainingRequest)];
  };

  updateRequest = (
    item: RequestItem,
    action: RequestActions,
    payload: UpdateRequestPayload
  ) => {
    switch (action) {
      case RequestActions.UPDATE_STATUS:
        const idx = this.REQUESTS.findIndex((i: any) => i.id === item.id);

        if (idx === null || idx === undefined) return;

        const obj = {
          ...item,
          status: payload.status,
        };

        this.REQUESTS[idx] = obj;
        break;
    }
  };
}
