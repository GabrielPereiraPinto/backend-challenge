require("dotenv").config();

const fetch = require("node-fetch");
const express = require("express");
const app = express();

const port = process.env.API_PORT;

app.listen(port, () => {
  console.log(`It' working! access http://localhost:${port}/`);
});

app.get("", async function (req, res) {
  res.send(
    `It's working! To use the API go to the http://localhost:${port}/items route, the query optionals parameters are page and perPage`
  );
});

app.get("/items", async function (req, res) {
  const page = req.query.page ? req.query.page : 1;
  const perPage = req.query.perPage ? req.query.perPage : 100;

  const result = await getItems(page, perPage);

  res.send(result);
});

async function getItems(page, perPage) {
  const legacyNumbers = getLegacyNumbers(page, perPage);

  let items = await getLegacyItems(legacyNumbers.currentLegacyPage);
  items = paginateCurrentItems(
    items,
    legacyNumbers.lastItemIndex,
    page,
    perPage
  );

  return items;
}

async function getLegacyItems(legacyPage) {
  try {
    const response = await fetch(`${process.env.LEGACY_URL}/items?page=${legacyPage}`);
    if (!response.status || response.status !== 200) {
      throw new Error(`Request failed with ${result.status}`);
    }

    const result = await response.json();
    if (!Object.keys(result.data).length) {
      throw new Error("No response");
    }

    return result;
  } catch (error) {
    console.log(
      `Unexpected error when requesting to Legacy-Api: ${error.response.body} `
    );
  }
}

function getLegacyNumbers(page, perPage) {
  const lastItemIndex = page * perPage;
  const currentLegacyPage = Math.floor(lastItemIndex / 100) + 1; // the start is page 1 and not 0
  return { lastItemIndex, currentLegacyPage };
}

function paginateCurrentItems(items, lastItemIndex, page, perPage) {
  items.metadata.page = page;
  items.metadata.perPage = perPage;

  const firstItemIndex = lastItemIndex - perPage;
  const dataIndex = firstItemIndex.toString().slice(-2); // only the last two digits are valid for the array position since it always grows in hundreds
  const data = items.data.splice(dataIndex, perPage);

  items.data = data;

  return items;
}
