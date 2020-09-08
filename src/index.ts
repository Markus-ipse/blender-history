import { files } from "./blend-files";
import { formatDistance } from "date-fns";

const transformed = files.map((f) => {
  const created = new Date(f.created);
  const lastModified = new Date(f.lastModified);
  const dateDiff = formatDistance(created, lastModified);
  return { ...f, dateDiff };
});

console.log(transformed);
