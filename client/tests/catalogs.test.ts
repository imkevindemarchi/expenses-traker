import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = path.join(root, "src/i18n/locales");
function leaves(value: Record<string, unknown>, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) =>
      typeof item === "string"
        ? [[prefix + key, item]]
        : Object.entries(leaves(item as Record<string, unknown>, prefix + key + ".")),
    ),
  );
}
const load = (name: string) =>
  leaves(JSON.parse(readFileSync(path.join(directory, name + ".json"), "utf8")));
const catalogs = {
  translation: load("en"),
  messages: existsSync(path.join(directory, "messages.en.json"))
    ? JSON.parse(readFileSync(path.join(directory, "messages.en.json"), "utf8"))
    : {},
};
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(path.join(dir, entry.name))
      : /\.[tj]sx?$/.test(entry.name)
        ? [path.join(dir, entry.name)]
        : [],
  );
}
function literals(node: ts.Node): string[] {
  if (ts.isStringLiteralLike(node)) return [node.text];
  if (ts.isConditionalExpression(node))
    return [...literals(node.whenTrue), ...literals(node.whenFalse)];
  return [];
}
test("Catalogs have identical keys, nonempty values and matching interpolation variables", () => {
  for (const [enName, itName] of [
    ["en", "it"],
    ["messages.en", "messages.it"],
  ]) {
    if (!existsSync(path.join(directory, enName + ".json"))) continue;
    const en = load(enName),
      it = load(itName);
    assert.deepEqual(Object.keys(en).sort(), Object.keys(it).sort());
    for (const key of Object.keys(en)) {
      assert.ok(en[key].trim() && it[key].trim(), key);
      const variables = (text: string) => text.match(/{{\s*\w+\s*}}/g)?.sort() ?? [];
      assert.deepEqual(variables(en[key]), variables(it[key]), key);
    }
  }
});
test("Literal and conditional translation calls resolve in both languages, including plurals", () => {
  for (const file of files(path.join(root, "src"))) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const visit = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        ["t", "tr"].includes(node.expression.text) &&
        node.arguments[0]
      ) {
        const catalog = node.expression.text === "t" ? catalogs.translation : catalogs.messages;
        for (const key of literals(node.arguments[0]))
          assert.ok(
            key in catalog || (key + "_one" in catalog && key + "_other" in catalog),
            `${file}: ${key}`,
          );
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
});
