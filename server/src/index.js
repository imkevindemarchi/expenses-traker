import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";
import { app } from "./app.js";
import { Account, Category, Subcategory, Entry } from "./models.js";
const { JWT_SECRET, MONGODB_URI, APP_ORIGIN } = process.env;

dns.setServers(["8.8.8.8", "8.8.4.4"]);
if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.startsWith("REPLACE_"))
  throw new Error(
    "Configura JWT_SECRET in server/.env con un valore casuale di almeno 32 caratteri.",
  );
if (!MONGODB_URI || !APP_ORIGIN)
  throw new Error("Configura MONGODB_URI e APP_ORIGIN in server/.env.");
await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
// A replica set is required for atomic category/entry operations (Atlas already provides one).
const hello = await mongoose.connection.db.admin().command({ hello: 1 });
if (!hello.setName && hello.msg !== "isdbgrid")
  throw new Error(
    "MongoDB deve usare un replica set. Usa MongoDB Atlas oppure segui la guida locale nel README.",
  );
await Promise.all([
  Account.init(),
  Category.init(),
  Subcategory.init(),
  Entry.init(),
]);
const server = app.listen(Number(process.env.PORT ?? 4000), () =>
  console.log(
    `Expenses Traker disponibile sulla porta ${process.env.PORT ?? 4000}`,
  ),
);
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  });
