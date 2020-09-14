import { readdir, stat } from "fs/promises";
import { resolve } from "path";
import { Dirent } from "fs";
import { isBefore, addMonths } from "date-fns";

const BLENDER_PROJECTS_PATH =
  "/mnt/c/Users/marku/Dropbox/Docs/Blender/Projects/";

console.log(__dirname, process.cwd());

export async function* getFiles(dir: string): AsyncGenerator<string | Dirent> {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

export const getModfiedFilerPerMonth = async () => {
  const changedFilesPerMonth: { [key: string]: string[] } = {};

  for await (const f of getFiles(BLENDER_PROJECTS_PATH)) {
    if (f instanceof Dirent) {
      throw new Error("Wrong type!");
    }

    const lowercasePath = f.toLowerCase();
    if (
      lowercasePath.includes("source") ||
      lowercasePath.includes(".git") ||
      lowercasePath.includes("renders/wireframe") ||
      lowercasePath.includes("/refs") ||
      lowercasePath.includes("/references") ||
      lowercasePath.includes("/ref pics") ||
      lowercasePath.includes("/textures/") ||
      lowercasePath.endsWith(".hdr")
    ) {
      continue;
    }

    const stats = await stat(f);
    const modified = stats.mtime;

    const key = getKey(modified);

    if (!changedFilesPerMonth[key]) {
      changedFilesPerMonth[key] = [];
    }

    changedFilesPerMonth[key].push(f.substr(BLENDER_PROJECTS_PATH.length));
  }
  // console.log(changedFilesPerMonth);

  return changedFilesPerMonth;
};

export const getLineData = async () => {
  const modified = await getModfiedFilerPerMonth();

  const datesWithModifiedFiles = Object.keys(modified).sort((a, b) =>
    a.localeCompare(b)
  );

  const allDates = createMonthSeries(datesWithModifiedFiles[0]);

  console.log(datesWithModifiedFiles, allDates);

  const lineData = allDates.map((dateKey) => ({
    x: dateKey,
    y: modified[dateKey]?.length ?? 0,
  }));

  return lineData;
};

function getKey(modified: Date) {
  let month = "" + modified.getMonth();

  if (month.length === 1) month = "0" + month;

  const key = modified.getFullYear() + "-" + month;
  return key;
}

function createMonthSeries(minDate: string) {
  const series = [];

  const now = new Date();
  let date = new Date(minDate + "-01");

  while (isBefore(date, now)) {
    series.push(getKey(date));
    date = addMonths(date, 1);
  }

  return series;
}
