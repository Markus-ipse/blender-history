import { readdir, stat } from "fs/promises";
import { resolve } from "path";
import { Dirent } from "fs";
import { isBefore, addMonths } from "date-fns";

const BLENDER_PROJECTS_PATH =
  "/mnt/c/Users/marku/Dropbox/Docs/Blender/Projects/";

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

export const getModfiedFilesPerMonth = async (dir: string) => {
  const changedFilesPerMonth: { [key: string]: string[] } = {};

  for await (const f of getFiles(BLENDER_PROJECTS_PATH + dir)) {
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

export const getLineData = async (dir: string) => {
  const modified = await getModfiedFilesPerMonth(dir);

  const allDates = createMonthSeries();

  const lineData = allDates.map((dateKey) => modified[dateKey]?.length ?? 0);

  return lineData;
};

export const getDataSets = async () => {
  const projects = await (
    await readdir(BLENDER_PROJECTS_PATH, { withFileTypes: true })
  )
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const dataSets = [];
  let colorIndex = 0;
  for (const pDir of projects) {
    const lineData = await (await getLineData(pDir)).map((count, i, arr) => {
      if (!arr[i - 1] && count === 0 && !arr[i + 1]) return null;

      return count;
    });

    const color = colors[colorIndex++];
    dataSets.push({
      label: pDir,
      data: lineData,
      borderColor: color,
      backgroundColor: hexToRgbA(color, 0.2),
    });
  }
  // console.log(JSON.stringify(dataSets, null, 2));

  return dataSets;
};

function getKey(modified: Date) {
  let month = "" + (modified.getMonth() + 1);

  if (month.length === 1) month = "0" + month;

  const key = modified.getFullYear() + "-" + month;
  return key;
}

export function getLabel(key: string) {
  const [year, month] = key.split("-");

  return (months as any)[month] + ", " + year;
}

export function createMonthSeries(minDate = "2011-08") {
  const series = [];

  const now = new Date();
  let date = new Date(minDate + "-01");

  while (isBefore(date, now)) {
    series.push(getKey(date));
    date = addMonths(date, 1);
  }

  return series;
}

function hexToRgbA(hex: string, alpha: number) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(hex + " is not a valid hex color");

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const months = {
  "01": "Jan",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "May",
  "06": "Jun",
  "07": "Jul",
  "08": "Aug",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Dec",
};

const colors = [
  "#ff0029",
  "#377eb8",
  "#66a61e",
  "#984ea3",
  "#00d2d5",
  "#ff7f00",
  "#af8d00",
  "#7f80cd",
  "#b3e900",
  "#c42e60",
  "#a65628",
  "#f781bf",
  "#8dd3c7",
  "#bebada",
  "#fb8072",
  "#80b1d3",
];

console.log(colors.map((c) => hexToRgbA(c, 0.2)));
