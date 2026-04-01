import * as cheerio from "cheerio";
import { v5 as uuidv5 } from "uuid";

/**
 * Parse webpage data response
 * @param  {String} data - html response
 * @return {Object} deals
 */
const parse = data => {
  const $ = cheerio.load(data);

  return $("article.cept-thread-item")
    .map((i, element) => {
      const jsonStr = $(element).find(".js-vue3").first().attr("data-vue3");
      if (!jsonStr) return null;

      try {
        const vueData = JSON.parse(jsonStr);
        const thread = vueData.props.thread;
        if (!thread) return null;

        const link = "https://www.dealabs.com/bons-plans/" + thread.titleSlug + "-" + thread.threadId;

        const retail = thread.nextBestPrice || thread.retailPrice || null;
        const discount = retail && thread.price ? Math.round((1 - thread.price / retail) * 100) : (thread.discountPercent || null);

        // Extract LEGO set ID: try title first, then strip thread ID from URL and search there
        const idFromTitle = thread.title.match(/\b(\d{4,6})\b/)?.[1];
        const urlSlug = link.replace(/-\d{7}$/, '');
        const idFromUrl = !idFromTitle ? urlSlug.match(/\b(\d{4,6})\b/)?.[1] : null;
        const id = idFromTitle || idFromUrl || null;

        return {
          link,
          id,
          price: thread.price,
          retail,
          discount: discount > 0 ? discount : null,
          temperature: thread.temperature ?? thread.heat ?? 0,
          comments: thread.commentsCount ?? thread.commentCount ?? thread.numComments ?? 0,
          title: thread.title,
          published: thread.publishedAt,
          image: thread.mainImage ? `https://static-pepper.dealabs.com/${thread.mainImage.path}/${thread.mainImage.name}/re/300x300/qt/60/${thread.mainImage.name}.jpg` : null,
          uuid: uuidv5(link, uuidv5.URL)
        };
      } catch (e) {
        return null;
      }
    })
    .get()
    .filter(deal => deal !== null);
};

/**
 * Scrape a given url page
 * @param {String} url - url to parse
 * @returns
 */
const scrape = async url => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });

  if (response.ok) {
    const body = await response.text();

    return parse(body);
  }

  console.error(response);

  return null;
};

export {scrape};
