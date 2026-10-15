import mongoose from "mongoose";
import { Category, Subcategory, Entry } from "./models.js";
import { fail, text, color, dateKey, objectId, owned } from "./validation.js";

const invalid = () => fail("Backup non valido o troppo grande.");
const record = (value) => value && typeof value === "object" && !Array.isArray(value);
const reference = (value) => objectId(value).toLowerCase();

export function validateBackup(body) {
  if (
    !record(body) ||
    body.app !== "expensestraker" ||
    body.version !== 1 ||
    !Array.isArray(body.categories) ||
    !Array.isArray(body.subcategories) ||
    !Array.isArray(body.entries) ||
    body.categories.length > 1000 ||
    body.subcategories.length > 5000 ||
    body.entries.length > 20000
  )
    invalid();
  const normalize = (items, read) => {
    const ids = new Set();
    return items.map((item) => {
      if (!record(item)) invalid();
      const oldId = reference(item._id);
      if (ids.has(oldId)) invalid();
      ids.add(oldId);
      return { oldId, ...read(item) };
    });
  };
  const categories = normalize(body.categories, (item) => ({
    name: text(item.name, "Nome", 60),
    color: color(item.color),
  }));
  const categoryIds = new Set(categories.map((item) => item.oldId));
  const subcategories = normalize(body.subcategories, (item) => ({
    name: text(item.name, "Nome", 60),
    category: reference(item.category),
  }));
  if (subcategories.some((item) => !categoryIds.has(item.category)))
    fail("Riferimenti non validi nel backup.");
  const bySubcategory = new Map(subcategories.map((item) => [item.oldId, item]));
  const entries = normalize(body.entries, (item) => {
    const category = reference(item.category);
    if (!categoryIds.has(category) || !["income", "expense"].includes(item.kind)) invalid();
    if (
      !Number.isSafeInteger(item.amountCents) ||
      item.amountCents < 1 ||
      item.amountCents > 100_000_000
    )
      invalid();
    let subcategory;
    if (item.subcategory == null) {
      // Older exports can contain transactions without a subcategory.
      subcategory = `legacy:${category}`;
      if (!bySubcategory.has(subcategory)) {
        const fallback = { oldId: subcategory, name: "Nessuna sottocategoria", category };
        subcategories.push(fallback);
        bySubcategory.set(subcategory, fallback);
      }
    } else {
      subcategory = reference(item.subcategory);
      if (bySubcategory.get(subcategory)?.category !== category)
        fail("Riferimenti non validi nel backup.");
    }
    return {
      kind: item.kind,
      amountCents: item.amountCents,
      date: dateKey(item.date),
      category,
      subcategory,
    };
  });
  return { categories, subcategories, entries };
}

export async function importBackup(
  user,
  body,
  database = mongoose,
  models = { Category, Subcategory, Entry },
) {
  const input = validateBackup(body);
  const session = await database.startSession();
  try {
    return await session.withTransaction(async () => {
      const categoryIds = new Map();
      const subcategoryIds = new Map();
      let categories = 0,
        subcategories = 0;
      for (const item of input.categories) {
        let category = await models.Category.findOneAndUpdate(
          { ...owned(user), name: item.name },
          { $set: { updatedAt: new Date() } },
          { session, new: true },
        );
        if (!category) {
          [category] = await models.Category.create(
            [{ user, name: item.name, color: item.color }],
            { session },
          );
          categories++;
        }
        categoryIds.set(item.oldId, category._id);
      }
      for (const item of input.subcategories) {
        const category = categoryIds.get(item.category);
        let subcategory = await models.Subcategory.findOneAndUpdate(
          { ...owned(user), category, name: item.name },
          { $set: { updatedAt: new Date() } },
          { session, new: true },
        );
        if (!subcategory) {
          [subcategory] = await models.Subcategory.create([{ user, category, name: item.name }], {
            session,
          });
          subcategories++;
        }
        subcategoryIds.set(item.oldId, subcategory._id);
      }
      if (input.entries.length)
        await models.Entry.insertMany(
          input.entries.map((item) => ({
            user,
            kind: item.kind,
            amountCents: item.amountCents,
            date: item.date,
            category: categoryIds.get(item.category),
            subcategory: subcategoryIds.get(item.subcategory),
          })),
          { session },
        );
      return { categories, subcategories, entries: input.entries.length };
    });
  } finally {
    await session.endSession();
  }
}
