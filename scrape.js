const request = require("request-promise");
const cheerio = require("cheerio");
const Epub = require("epub-gen");

const books = [
  "https://cassiopaea.org/category/volumes/amazing-grace/",
  "https://cassiopaea.org/category/volumes/comets-and-catastrophes/",
  "https://cassiopaea.org/category/volumes/cosmic-cointelpro-timeline/",
  "https://cassiopaea.org/category/volumes/john-f-kennedy/",
  "https://cassiopaea.org/category/volumes/jupiter-nostradamus-edgar-cayce-and-the-return-of-the-mongols/",
  "https://cassiopaea.org/category/volumes/cassiopaean-hit-list/",
  "https://cassiopaea.org/category/volumes/the-grail-quest-and-the-destiny-of-man/",
  "https://cassiopaea.org/category/volumes/the-wave/",
  "https://cassiopaea.org/category/volumes/the-wave-volume-2/",
  "https://cassiopaea.org/category/volumes/the-wave-volume-3/",
  "https://cassiopaea.org/category/volumes/the-wave-volume-4/",
  "https://cassiopaea.org/category/volumes/the-wave-volume-56/",
  "https://cassiopaea.org/category/volumes/the-wave-volume-7/",
  "https://cassiopaea.org/category/volumes/the-wave-volume-8/",
  "https://cassiopaea.org/category/volumes/truth-or-lies/",
  "https://cassiopaea.org/category/volumes/who-wrote-the-bible/",
  "https://cassiopaea.org/category/articles/the-ufo-phenomenon/",
  "https://cassiopaea.org/category/articles/science/",
  "https://cassiopaea.org/category/articles/religion-articles/",
  "https://cassiopaea.org/category/articles/psychopathy-studies/",
  "https://cassiopaea.org/category/articles/our-haunted-planet/",
  "https://cassiopaea.org/category/articles/nwo-global-elite/",
  "https://cassiopaea.org/category/articles/new-age-cointelpro/",
  "https://cassiopaea.org/category/articles/knowledge-and-being/",
  "https://cassiopaea.org/category/articles/history/",
  "https://cassiopaea.org/category/articles/esotericism/",
  "https://cassiopaea.org/category/articles/earth-changes/",
  "https://cassiopaea.org/category/articles/dossier-9-11-and-after/",
  "https://cassiopaea.org/category/articles/conspiracy/",
  "https://cassiopaea.org/category/articles/commentary/",
  "https://cassiopaea.org/category/articles/catastrophism/",
  "https://cassiopaea.org/category/articles/book-reviews/",
  "https://cassiopaea.org/category/articles/answers-to-questions-from-readers/"
];

var collectedLinks = [];
const collectedPageContent = new Object();
collectedPageContent["book"] = "";
collectedPageContent["title"] = [];
collectedPageContent["content"] = [];

function collectLinks(url) {
  return request(url, (error, response, html) => {
    if (!error && response.statusCode === 200) {
      const $ = cheerio.load(html);

      const entries = $(".entry");

      const titles = $("h1");

      var book = $(titles).text();

      book = book.replace("/", "");

      collectedPageContent["book"] = book;

      entries.each((i, el) => {
        const item = $(el).find("a");
        collectedLinks.push($(item).attr("href"));
      });
    }
  });
}
async function scrapePage(url) {
  await request(url, (error, response, html) => {
    if (!error && response.statusCode === 200) {
      console.log("Scraped: " + url);
      const $ = cheerio.load(html);

      const entries = $(".entry");

      entries.each((i, el) => {
        const title = $(el).find("h1");
        const content = $(el).find("p");
        collectedPageContent["title"].push($(title).text());
        var contentBuild = "";
        content.each((i, el) => {
          if (
            $(el)
              .html()
              .includes("Continue to Chapter")
          ) {
            //Skip as don't require this link
          } else {
            contentBuild += "<p>" + $(el).html() + "</p>";
          }
        });
        collectedPageContent["content"].push(contentBuild);
        return;
      });
    } else {
      return false;
    }
  });
}

async function fireLinks(collectedLinks) {
  for (const link of collectedLinks) {
    await scrapePage(link);
  }
}

async function run() {
  for (const book of books) {
    await collectLinks(book).then(async links => {
      console.log(collectedLinks);
      await fireLinks(collectedLinks).then(e => {
        console.log("done!");

        var chapter = [];
        collectedPageContent.title.forEach((e, index) => {
          var chapterNew = new BookContent(
            e,
            collectedPageContent.content[index]
          );
          chapter.push({ title: chapterNew.title, data: chapterNew.data });
        });

        const option = {
          title: collectedPageContent.book, // *Required, title of the book.
          author: "Cassiopaea.org", // *Required, name of the author.
          content: chapter
        };

        const output = collectedPageContent.book + ".epub";

        new Epub(option, output);
        collectedLinks = [];
        collectedPageContent["book"] = "";
        collectedPageContent["title"] = [];
        collectedPageContent["content"] = [];
        return;
      });
      return;
    });
  }
}

class BookContent {
  constructor(title, data) {
    this.title = title;
    this.data = data;
  }
}
run();
