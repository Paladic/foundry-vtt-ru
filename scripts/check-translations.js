import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

// Validate all module dictionaries before packaging the language module.
// Some files contain structured data (e.g. Automated Animations mappings),
// so do not assume that every nested value must be a string.
const root = "public";
const dir = join(root, "i18n", "modules");
const errors = [];
const fail = (message) => errors.push(message);

// JSON.parse silently overwrites duplicate object keys.
function findDuplicateKeys(source) {
  let position = 0;
  const duplicates = [];

  function skipWhitespace() {
    while (position < source.length && /\s/.test(source[position])) position++;
  }

  function readString() {
    const start = position++;
    while (position < source.length) {
      const char = source[position++];
      if (char === "\\") position++;
      else if (char === '"') break;
    }
    return JSON.parse(source.slice(start, position));
  }

  function readValue(path) {
    skipWhitespace();
    if (source[position] === "{") {
      position++;
      skipWhitespace();
      const seen = new Set();
      while (source[position] !== "}") {
        const key = readString();
        const keyPath = path ? path + "." + key : key;
        if (seen.has(key)) duplicates.push(keyPath);
        seen.add(key);
        skipWhitespace();
        position++; // ':', already validated by JSON.parse
        readValue(keyPath);
        skipWhitespace();
        if (source[position] !== ",") break;
        position++;
        skipWhitespace();
      }
      position++; // '}'
    } else if (source[position] === "[") {
      position++;
      skipWhitespace();
      let index = 0;
      while (source[position] !== "]") {
        readValue(path + "[" + index++ + "]");
        skipWhitespace();
        if (source[position] !== ",") break;
        position++;
        skipWhitespace();
      }
      position++; // ']'
    } else if (source[position] === '"') {
      readString();
    } else {
      while (position < source.length && !/[\s,\]}]/.test(source[position])) position++;
    }
  }

  readValue("");
  return duplicates;
}

async function readJson(file) {
  const content = await readFile(file, "utf8");
  try {
    const json = JSON.parse(content.replace(/^\uFEFF/, ""));
    for (const duplicate of findDuplicateKeys(content)) {
      fail(`${file}: duplicate JSON key '${duplicate}'`);
    }
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      fail(`${file}: expected a JSON object at the root`);
    }
    return json;
  } catch (error) {
    fail(`${file}: invalid JSON — ${error.message}`);
    return null;
  }
}

const manifest = await readJson(join(root, "module.json"));
if (!manifest || !Array.isArray(manifest.languages)) {
  fail("public/module.json: languages must be an array");
}

const registrations = new Map();
for (const language of manifest?.languages ?? []) {
  if (!language.module) continue;

  const id = language.module;
  if (registrations.has(id)) fail(`Duplicate module registration: ${id}`);
  registrations.set(id, language);

  if (language.lang !== "ru") fail(`${id}: expected lang 'ru'`);

  const expected = `i18n/modules/${id}.json`;
  if (language.path !== expected) {
    fail(`${id}: unexpected path '${language.path}', expected '${expected}'`);
  }
}

const filenames = (await readdir(dir)).filter((name) => name.endsWith(".json"));
const files = new Set(filenames);
let parsed = 0;

for (const filename of filenames) {
  const id = filename.slice(0, -5);
  if (!registrations.has(id)) fail(`Unregistered translation file: ${filename}`);
  if (await readJson(join(dir, filename))) parsed++;
}

for (const [id] of registrations) {
  if (!files.has(`${id}.json`)) fail(`Missing translation file: ${id}.json`);
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`Translation validation failed with ${errors.length} error(s).`);
  process.exitCode = 1;
} else {
  console.log(`OK: ${parsed} valid module JSON dictionaries, ${registrations.size} registered modules.`);
}
