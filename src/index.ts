import ejs = require("ejs");
import { getDataSets, createMonthSeries, getLabel } from "./get-modified-files";
import { mkdir, writeFile, copyFile } from "fs/promises";

async function render() {
  const dataSets = await getDataSets();
  const labels = createMonthSeries().map(getLabel);

  try {
    //create output directory
    await mkdir("dist/static", { recursive: true });
    await Promise.all([
      copyFile("client/index.js", "dist/static/index.js"),
      copyFile("client/styles.css", "dist/static/styles.css"),
    ]);

    //render ejs template to html string
    const html = await ejs
      .renderFile(__dirname + "/index.ejs", {
        dataSets: JSON.stringify(dataSets),
        labels: JSON.stringify(labels),
      })
      .then((output) => output);

    //create file and write html
    await writeFile("dist/index.html", html, "utf8");
  } catch (error) {
    console.log(error);
  }
}

render();
