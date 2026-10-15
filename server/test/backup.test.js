import test from "node:test";
import assert from "node:assert/strict";
import { validateBackup, importBackup } from "../src/backup.js";

const category = "a".repeat(24),
  subcategory = "b".repeat(24),
  entry = "c".repeat(24);
const backup = () => ({
  version: 1,
  app: "expensestraker",
  account: { email: "old@example.invalid" },
  categories: [{ _id: category, user: "other-owner", name: "Casa", color: "#123456" }],
  subcategories: [{ _id: subcategory, user: "other-owner", name: "Spesa", category }],
  entries: [
    {
      _id: entry,
      user: "other-owner",
      category,
      subcategory,
      kind: "expense",
      amountCents: 1234,
      date: "2026-10-15",
    },
  ],
});

test("native exports retain amounts and references while account and ownership metadata are excluded", () => {
  const result = validateBackup(backup());
  assert.equal(result.entries[0].amountCents, 1234);
  assert.equal(result.entries[0].subcategory, subcategory);
  assert.equal(result.categories[0].user, undefined);
  assert.equal(result.entries[0].user, undefined);
  assert.equal(result.account, undefined);
});

test("malformed backups, duplicate identifiers, amounts and broken category references fail before a transaction", async () => {
  const cases = [
    null,
    {},
    { ...backup(), app: "gymtraker" },
    { ...backup(), version: 2 },
    { ...backup(), categories: [null] },
    { ...backup(), entries: Array(20001).fill({}) },
  ];
  for (const modify of [
    (data) => data.categories.push(data.categories[0]),
    (data) => data.entries.push(data.entries[0]),
    (data) => (data.entries[0].amountCents = 1.5),
    (data) => (data.entries[0].amountCents = -1),
    (data) => (data.entries[0].date = "2026-02-30"),
    (data) => (data.entries[0].kind = "other"),
    (data) => (data.entries[0].subcategory = "d".repeat(24)),
    (data) => (data.subcategories[0].category = "d".repeat(24)),
    (data) => {
      data.categories.push({ _id: "d".repeat(24), name: "Altro", color: "#ffffff" });
      data.entries[0].category = "d".repeat(24);
    },
  ]) {
    const data = backup();
    modify(data);
    cases.push(data);
  }
  for (const data of cases)
    await assert.rejects(
      importBackup("owner", data, {
        startSession: () => assert.fail("Invalid data must not start a transaction"),
      }),
      (error) => error.status === 400,
    );
});

test("legacy entries without a subcategory receive a valid fallback in their own category", () => {
  const data = backup();
  data.entries[0].subcategory = null;
  const result = validateBackup(data);
  const fallback = result.subcategories.find(
    (item) => item.oldId === result.entries[0].subcategory,
  );
  assert.equal(fallback.category, category);
  assert.equal(fallback.name, "Nessuna sottocategoria");
});

test("import scopes reusable names to the signed-in owner and remaps new records in one transaction", async () => {
  const writes = [];
  let ended = false,
    inTransaction = false;
  const session = {
    withTransaction: async (action) => {
      inTransaction = true;
      return action();
    },
    endSession: async () => {
      ended = true;
    },
  };
  const check = (options) => {
    assert.equal(options.session, session);
    assert.ok(inTransaction);
  };
  const models = {
    Category: {
      findOneAndUpdate: async (filter, update, options) => {
        check(options);
        assert.deepEqual(filter, { user: "owner", name: "Casa" });
        return { _id: "existing-category" };
      },
      create: () => assert.fail("Existing category must be reused"),
    },
    Subcategory: {
      findOneAndUpdate: async (filter, update, options) => {
        check(options);
        assert.deepEqual(filter, { user: "owner", category: "existing-category", name: "Spesa" });
        return null;
      },
      create: async (items, options) => {
        check(options);
        writes.push(...items);
        return [{ _id: "new-subcategory" }];
      },
    },
    Entry: {
      insertMany: async (items, options) => {
        check(options);
        writes.push(...items);
      },
    },
  };
  assert.deepEqual(
    await importBackup("owner", backup(), { startSession: async () => session }, models),
    { categories: 0, subcategories: 1, entries: 1 },
  );
  assert.deepEqual(writes, [
    { user: "owner", category: "existing-category", name: "Spesa" },
    {
      user: "owner",
      kind: "expense",
      amountCents: 1234,
      date: "2026-10-15",
      category: "existing-category",
      subcategory: "new-subcategory",
    },
  ]);
  assert.equal(ended, true);
});

test("database failures propagate through the transaction and always close the session", async () => {
  let ended = false,
    rejectedTransaction = false;
  const session = {
    withTransaction: async (action) => {
      try {
        return await action();
      } catch (error) {
        rejectedTransaction = true;
        throw error;
      }
    },
    endSession: async () => {
      ended = true;
    },
  };
  await assert.rejects(
    importBackup(
      "owner",
      backup(),
      { startSession: async () => session },
      {
        Category: {
          findOneAndUpdate: async () => {
            throw new Error("database failed");
          },
        },
      },
    ),
    /database failed/,
  );
  assert.ok(ended && rejectedTransaction);
});
