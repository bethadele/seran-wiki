const { stat, readDir } = Deno;
import { System } from "seran/system.ts";
import * as wiki from "seran/wiki.ts";
import { Request } from "seran/wiki.ts";
import {
  encode,
  decode
} from "std/encoding/base32.ts";

function b32path(path) {
  return encode(new TextEncoder().encode(path)).replace(/=/g, "");
}

export function siteMap() {
  return [
    {
      "welcome-visitors": {
        title: "Welcome Visitors",
        synopsis: "..."
      }
    }
  ];
}

export async function serve(req: Request, system: System) {
  if (req.url == "/welcome-visitors.json") {
    await wiki.serveJson(
      req,
      wiki.page(
        "Welcome Visitors",
        [wiki.paragraph(`[[${b32path("/")}]] - /`)]
      )
    );
  } else if (req.url.match("^/[a-z0-9]+.json")) {
    let parts = req.url.split(".json");
    let base32path = parts[0].substring(1, parts[0].length);
    let multipleOf = Math.ceil(base32path.length / 8);
    let targetLength = multipleOf * 8;
    base32path = base32path.padEnd(targetLength, "=");
    console.log("base32path", base32path);
    let path = new TextDecoder().decode(decode(base32path.toUpperCase()));
    console.log("path", path);

    let files = [];
    let fileInfo = await stat(path);
    if (fileInfo.isDirectory) {  
      for await (let file of readDir(path)) {
        console.log("readDir2", file.name);
        let fullPath = [path, file.name].join("/").replace("//", "/");
        files.push(
          wiki.paragraph(`[[${b32path(fullPath)}]] ${fullPath} - ${file.name.length}`)
        );
      }
    }

    let data = wiki.page(path, files);

    await wiki.serveJson(req, data);
  } else {
    await wiki.serve(req, system);
  }
}
