import { RequestStatus } from "./types";
import {
  createRequestItem,
  filterAlreadyAdded,
  filterExternalLinks,
  getBaseUrl,
  getLinks,
  removeWhiteSpaces,
} from "./utils";

test("Get base url test", () => {
  expect(getBaseUrl("https://www.poesi.as")).toEqual({
    protocol: "https",
    base: "https://www.poesi.as",
    domain: "www.poesi.as",
  });
  expect(getBaseUrl("http://www.poesi.as")).toEqual({
    protocol: "http",
    base: "http://www.poesi.as",
    domain: "www.poesi.as",
  });

  expect(getBaseUrl("https://www.poesi.as/index.htm")).toEqual({
    protocol: "https",
    base: "https://www.poesi.as",
    domain: "www.poesi.as",
  });

  expect(getBaseUrl("https://www.poesi.as/Gaspar_Aguilar.htm")).toEqual({
    protocol: "https",
    base: "https://www.poesi.as",
    domain: "www.poesi.as",
  });

  expect(getBaseUrl("https://mail.google.com/mail/u/0/?ogbl#inbox")).toEqual({
    protocol: "https",
    base: "https://mail.google.com",
    domain: "mail.google.com",
  });
});

test("Get valid links", () => {
  expect(getLinks('<a href="some-relative-path.htm">')).toEqual([
    "some-relative-path.htm",
  ]);

  expect(getLinks('<a href="some-relative-path/deep.htm">')).toEqual([
    "some-relative-path/deep.htm",
  ]);

  expect(getLinks('<a href="some-relative-path/deep.htm">')).toEqual([
    "some-relative-path/deep.htm",
  ]);

  expect(
    getLinks('<a href="https://mail.google.com/some-relative-path/deep.htm">')
  ).toEqual(["https://mail.google.com/some-relative-path/deep.htm"]);

  expect(getLinks('<a href="#">')).toEqual([]);
  expect(getLinks('<link href="some.css">')).toEqual([]);
  expect(getLinks('<link href="some.png">')).toEqual([]);
  expect(getLinks('<link href="some.ico">')).toEqual([]);
});

test("Filter external links", () => {
  expect(
    filterExternalLinks(
      [
        "https://www.domain.com",
        "https://www.lorem.domain.com",
        "https://www.facebook.com?some=https://www.domain.com",
        "https://www.twitter.com",
        "some-relative-path.htm",
        "https://www.facebook.com/Poes%C3%ADa-Espa%",
      ],
      "https://www.domain.com"
    )
  ).toEqual(["https://www.domain.com", "some-relative-path.htm"]);
});

test("Filter white spaces should work", () => {
  expect(removeWhiteSpaces("a          ")).toEqual("a");
  expect(removeWhiteSpaces("            a   d   d    ")).toEqual("add");
});

test("Create request item", () => {
  expect(createRequestItem("https://www.some-domain.com").url).toBe(
    "https://www.some-domain.com"
  );
  expect(
    createRequestItem("https://www.some-domain.com").id.length
  ).toBeGreaterThan(0);
  expect(createRequestItem("https://www.some-domain.com").status).toEqual(
    RequestStatus.PENDING
  );
});

test("Filter already processed", () => {
  expect(
    filterAlreadyAdded(
      [
        "https://www.poesi.as/some-other-page.html",
        "https://www.poesi.as/Felipe_Benitez_Reyes.htm",
        "https://www.poesi.as/Gonzalo_de_Berceo.htm",
      ],
      [
        {
          id: "bhdc1wn9m8i",
          url: "https://www.poesi.as/Felipe_Benitez_Reyes.htm",
          status: RequestStatus.PENDING,
        },
        {
          id: "87jq37uw04d",
          url: "https://www.poesi.as/Gonzalo_de_Berceo.htm",
          status: RequestStatus.PENDING,
        },
        {
          id: "1kx8hcpolb3",
          url: "https://www.poesi.as/Jose_Bergamin.htm",
          status: RequestStatus.PENDING,
        },
      ]
    )
  ).toEqual(["https://www.poesi.as/some-other-page.html"]);
});
