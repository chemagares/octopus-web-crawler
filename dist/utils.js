"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeLastSlashCharacter = exports.getBaseUrl = exports.createRequestItem = exports.filterExternalLinks = exports.getUrlsFromHtml = exports.filterAlreadyAdded = exports.removeWhiteSpaces = exports.save = void 0;
const types_1 = require("./types");
var fs = require("fs");
const save = (name, data) => {
    let moment = new Date().toISOString().substring(0, 19);
    moment = moment.replace(/:/g, "_");
    const path = `${__dirname}/../data/${name}-${moment}.json`;
    fs.writeFile(path, JSON.stringify(data, null, 2), "utf8", (err) => {
        console.log(`File saved ${path}`);
    });
};
exports.save = save;
const removeWhiteSpaces = (string) => {
    return string.replace(/\s/g, "");
};
exports.removeWhiteSpaces = removeWhiteSpaces;
const filterAlreadyAdded = (urls, processed) => {
    return urls.filter((n) => !processed.some((r) => r.url === n));
};
exports.filterAlreadyAdded = filterAlreadyAdded;
const getUrlsFromHtml = (html) => {
    const regex = new RegExp(/href="([^"]*)"/, "g");
    let matches = Array.from(html.matchAll(regex));
    matches = matches.map((m) => m[0]);
    matches = matches.map((m) => m.replace("href=", ""));
    matches = matches.map((m) => m.replace(/"/g, ""));
    matches = matches.map((m) => m.replace(/^\//g, ""));
    const notAllowed = ["#", "javascript", "()", ".css", ".ico", ".png"];
    matches = matches.filter((m) => !notAllowed.some((n) => m.includes(n)));
    return matches;
};
exports.getUrlsFromHtml = getUrlsFromHtml;
const filterExternalLinks = (urls, url) => {
    return urls.filter((m) => {
        const regex = new RegExp(`^${url}`);
        return !m.includes("http") || (m.includes("http") && m.match(regex));
    });
};
exports.filterExternalLinks = filterExternalLinks;
const createRequestItem = (url, from) => {
    return {
        id: Math.random().toString(36).slice(2),
        url,
        status: types_1.Status.PENDING,
        from: from ? from : null,
    };
};
exports.createRequestItem = createRequestItem;
const getBaseUrl = (url) => {
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
    if (protocol === null)
        return res;
    url = url.split(protocol)[1].replace("://", "");
    const domain = url.match(/\//) ? url.split("/")[0] : url;
    res = Object.assign(Object.assign({}, res), { base: `${protocol}://${domain}`, domain });
    return res;
};
exports.getBaseUrl = getBaseUrl;
const removeLastSlashCharacter = (str) => {
    return str.match(/\/$/) ? str.slice(0, -1) : str;
};
exports.removeLastSlashCharacter = removeLastSlashCharacter;
//# sourceMappingURL=utils.js.map