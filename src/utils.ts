import { RequestItem, RequestStatus, UrlProperties } from "./types";
const nodeFetch = require("node-fetch");
var fs = require("fs");

export const save = (name: any, data: any) => {
  let moment = new Date().toISOString().substring(0, 19);
  moment = moment.replace(/:/g, "_");
  const path = `${__dirname}/../data/${name}-${moment}.json`;

  fs.writeFile(path, JSON.stringify(data, null, 2), "utf8", (err: any) => {
    console.log(`File saved ${path}`);
  });
};

export const removeWhiteSpaces = (string: string) => {
  return string.replace(/\s/g, "");
};

export const filterAlreadyAdded = (
  urls: Array<string>,
  processed: Array<RequestItem>
): Array<string> => {
  return urls.filter((n) => !processed.some((r) => r.url === n));
};

export const getUrlsFromHtml = (html: string) => {
  // get links
  const regex = new RegExp(/href="([^"]*)"/, "g");
  let matches: any = Array.from(html.matchAll(regex));
  matches = matches.map((m: any) => m[0]);

  // clean them
  matches = matches.map((m: any) => m.replace("href=", ""));
  matches = matches.map((m: any) => m.replace(/"/g, ""));
  matches = matches.map((m: any) => m.replace(/^\//g, ""));

  const notAllowed = ["#", "javascript", "()", ".css", ".ico", ".png"];

  // exclude not allowed
  matches = matches.filter((m: any) => !notAllowed.some((n) => m.includes(n)));

  return matches;
};

export const filterExternalLinks = (urls: Array<string>, url: string) => {
  return urls.filter((m: any) => {
    const regex = new RegExp(`^${url}`);
    return !m.includes("http") || (m.includes("http") && m.match(regex));
  });
};

export const createRequest = (url: string) => {
  return nodeFetch(url, { method: "get" }).then((res: any) => res.buffer());
};

export const createRequestItem = (url: string, from?: string): RequestItem => {
  return {
    id: Math.random().toString(36).slice(2),
    url,
    status: RequestStatus.PENDING,
    from: from ? from : null,
  };
};

export const getBaseUrl = (url: string): UrlProperties => {
  let res;
  const protocol = url.match(/^https/)
    ? "https"
    : url.match(/^http/)
    ? "http"
    : null;

  res = {
    protocol,
    base: null,
    domain: null,
  };

  if (protocol === null) return res;

  url = url.split(protocol)[1].replace("://", "");

  const domain = url.match(/\//) ? url.split("/")[0] : url;

  res = {
    ...res,
    base: `${protocol}://${domain}`,
    domain,
  };

  return res;
};

export const removeLastSlashCharacter = (str: string) => {
  return str.match(/\/$/) ? str.slice(0, -1) : str;
};
