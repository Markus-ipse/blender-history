import { files } from "./blend-files";
import { formatDistance, isAfter } from "date-fns";
import util = require("util");
import fs = require("fs");
import ejs = require("ejs");

const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);

interface File {
  fileName: string;
  dir?: string;
  created: string;
  lastModified: string;
}

const transformFile = (f: File) => {
  const created = new Date(f.created);
  const lastModified = new Date(f.lastModified);
  const dateDiff = formatDistance(created, lastModified);
  const createdAfterModified = isAfter(created, lastModified);

  return {
    ...f,
    dateDiff,
    createdAfterModified: createdAfterModified ? "true" : "",
  };
};

const transformed = files
  .map(transformFile)
  .sort((a, b) => a.lastModified.localeCompare(b.lastModified));

const grouped: { [dir: string]: ReturnType<typeof transformFile>[] } = {};

transformed.forEach((f) => {
  if (f.dir) {
    grouped[f.dir] = [...(grouped[f.dir] ?? []), f];
  }
});

const columns = [
  "fileName",
  "dir",
  "created",
  "lastModified",
  "dateDiff",
  "createdAfterModified",
];

async function render() {
  try {
    //create output directory
    await mkdir("dist", { recursive: true });

    //render ejs template to html string
    const html = await ejs
      .renderFile(__dirname + "/index.ejs", {
        columns,
        projects: Object.values(grouped),
      })
      .then((output) => output);

    //create file and write html
    await writeFile("dist/index.html", html, "utf8");
  } catch (error) {
    console.log(error);
  }
}
console.log(__dirname);
render();
