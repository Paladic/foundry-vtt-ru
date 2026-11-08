import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

// Validate all module dictionaries before packaging the language module.
// Some files contain structured data (e.g. Automated Animations mappings),
// so do not assume that every nested value must be a string.
const root = "public";
const dir = join(root, "i18n", "modules");
const errors = [];
const fail = (message) => errors.push(message);

async function readJson(file) {
  const content = await readFile(file, "utf8");
  try {
    const json = JSON.parse(content.replace(/^\uFEFF/, ""));
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
