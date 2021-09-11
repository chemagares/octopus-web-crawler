# Lightweight web crawler created with NodeJS.

```js
const Crawler = require("octopus-web-crawler");

const crawler = new Crawler({
  url: "http://www.poesi.as",
  maxRequest: 12, // Total max requests
  concurrency: 4, // Maximum parallel requests
  delay: 500, // Delay between requests groups
});

crawler.on("request", (res) => {
  // Do something with requested page...
  // received object has the following properties:
  //   res = {
  //       url: 'some url' // Visited url,
  //       content: '<html>' // Html code
  //   }
});

crawler.on("finish", (res) => {
  // On finish it returns an array with all processed urls:
  // [
  //     {
  //       id: "8mhgdm484tx", // First url
  //       url: "https://www.poesi.as",
  //       status: "DONE",
  //       from: null, // has no parent url
  //     },
  //     {
  //       id: "1livlpc1djj",
  //       url: "https://www.poesi.as/poesia.htm",
  //       status: "DONE",
  //       from: "8mhgdm484tx", // found int first url
  //     }
  // ]
  // Do something on finish...
});
```
