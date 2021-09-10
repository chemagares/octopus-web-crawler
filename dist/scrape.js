"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scrapper = void 0;
const types_1 = require("./types");
const utils_1 = require("./utils");
const EventEmitter = require("events");
const iconv = require("iconv-lite");
class Scrapper extends EventEmitter {
    constructor(opts) {
        super();
        this.maxRequests = 100;
        this.delay = 100;
        this.requests = [];
        this.start = new Date().getTime();
        this.next = () => {
            const todo = this.requests.filter((i) => i.status === types_1.RequestStatus.PENDING);
            if (todo.length === 0) {
                console.log("All items have been processed.");
                console.log(`Made ${this.requests.length} request in ${(new Date().getTime() - this.start) / 1000} seconds.`);
                this.emit("finish", { requests: this.requests });
                return;
            }
            this.processItem(todo[0]);
        };
        this.processItem = (item) => {
            const req = (0, utils_1.createRequest)(item.url);
            req
                .then((data) => {
                data = iconv.decode(data, "win1252");
                const res = {
                    url: item.url,
                    content: data,
                };
                this.emit("request", res);
                data = (0, utils_1.removeWhiteSpaces)(data);
                this.updateRequest(item, types_1.RequestActions.UPDATE_STATUS, {
                    status: types_1.RequestStatus.DONE,
                });
                if (this.requests.length >= this.maxRequests)
                    return;
                this.addUrls(item, data);
            })
                .catch(() => {
                this.updateRequest(item, types_1.RequestActions.UPDATE_STATUS, {
                    status: types_1.RequestStatus.FAILED,
                });
            })
                .finally(() => {
                setTimeout(() => this.next(), this.delay);
            });
        };
        this.addUrls = (item, html) => {
            let links = (0, utils_1.getUrlsFromHtml)(html);
            links = [...new Set(links)];
            let news = this.getAbsoluteUrls(links);
            news = (0, utils_1.filterExternalLinks)(news, this.baseUrl);
            news = (0, utils_1.filterAlreadyAdded)(news, this.requests);
            const items = news.map((i) => (0, utils_1.createRequestItem)(i, item.id));
            const remaining = this.maxRequests - this.requests.length;
            this.requests = [...this.requests, ...items.slice(0, remaining)];
        };
        this.getAbsoluteUrls = (links) => {
            return links.map((link) => {
                const isAbsolute = link.includes("http");
                link = isAbsolute ? link : link.replace(/^\//g, "");
                return isAbsolute ? link : `${this.baseUrl}/${link}`;
            });
        };
        this.updateRequest = (item, action, payload) => {
            switch (action) {
                case types_1.RequestActions.UPDATE_STATUS:
                    const idx = this.findRequestIndex(item);
                    const update = Object.assign(Object.assign({}, item), { status: payload.status });
                    this.requests[idx] = update;
                    break;
            }
        };
        this.findRequestIndex = (req) => {
            return this.requests.findIndex((i) => i.id === req.id);
        };
        let { url, delay, maxRequest } = opts;
        url = (0, utils_1.removeLastSlashCharacter)(url);
        this.delay = delay;
        this.maxRequests = maxRequest;
        const props = (0, utils_1.getBaseUrl)(url);
        if (props.base === null || props.domain === null) {
            throw new Error("The url provided is not valid");
        }
        this.baseUrl = props.base;
        this.domain = props.domain;
        const r = (0, utils_1.createRequestItem)(url);
        this.requests.push(r);
        this.next();
    }
}
exports.Scrapper = Scrapper;
//# sourceMappingURL=scrape.js.map