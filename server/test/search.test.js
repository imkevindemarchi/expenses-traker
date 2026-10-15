import assert from "node:assert/strict";
import { test } from "node:test";
import { periodFilter } from "../src/app.js";
import { Category, Subcategory } from "../src/models.js";

test("filtro per sottocategoria da sola o combinata con categoria e tipo", async () => {
  const owner = "a".repeat(24);
  const category = "b".repeat(24);
  const subcategory = "c".repeat(24);
  for (const extra of [{}, { category, kind: "expense" }]) {
    const filter = await periodFilter({
      account: { _id: owner },
      query: { month: "2026-10", subcategory, ...extra },
    });
    assert.equal(filter.user, owner);
    assert.equal(filter.subcategory.toHexString(), subcategory);
    assert.deepEqual(filter.date, { $gte: "2026-10-01", $lte: "2026-10-31" });
    assert.equal(filter.category?.toHexString(), extra.category);
    assert.equal(filter.kind, extra.kind);
  }
  const unfiltered = await periodFilter({ account: { _id: owner }, query: { month: "2026-10" } });
  assert.equal(unfiltered.subcategory, undefined);
  await assert.rejects(() => periodFilter({
    account: { _id: owner },
    query: { month: "2026-10", subcategory: "invalid" },
  }));
});
test("ricerca delle transazioni per nomi di categoria e sottocategoria, limitata al proprietario e con regex escapata", async (context) => {
  const owner = "a".repeat(24);
  const queries = [];
  context.mock.method(Category, "find", (query) => {
    queries.push(query);
    return { select: () => ({ lean: async () => [{ _id: "category-a" }] }) };
  });
  context.mock.method(Subcategory, "find", (query) => {
    queries.push(query);
    return { select: () => ({ lean: async () => [{ _id: "subcategory-a" }] }) };
  });
  const filter = await periodFilter({
    account: { _id: owner },
    query: { month: "2026-10", q: "[Bills].*" },
  });
  assert.equal(filter.user, owner);
  for (const query of queries) {
    assert.equal(query.user, owner);
    assert.equal(query.name.$regex, "\\[Bills\\]\\.\\*");
  }
  assert.deepEqual(filter.$or, [
    { category: { $in: ["category-a"] } },
    { subcategory: { $in: ["subcategory-a"] } },
  ]);
});
