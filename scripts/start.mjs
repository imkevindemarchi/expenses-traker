// Avvia insieme back-end (server) e front-end (client) e mostra le porte.
// Nessuna dipendenza: solo Node. Le porte si leggono da client/vite.config.ts
// (porta del dev server + target del proxy /api), così restano in un solo posto.
// Uso: npm start            → server e client in modalità sviluppo (watch)
//      npm start -- --no-watch → server senza riavvio automatico
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const color = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (text) => (color ? `\x1b[${code}m${text}\x1b[0m` : text);
const bold = paint("1");
const dim = paint("2");
const green = paint("32");
const cyan = paint("36");
const magenta = paint("35");
const red = paint("31");
const yellow = paint("33");

const appName = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).name;
const vite = readFileSync(path.join(root, "client", "vite.config.ts"), "utf8");
const clientPort = Number(/server:\s*\{[^}]*?\bport:\s*(\d+)/.exec(vite)?.[1]);
const serverPort = Number(/target:\s*["']https?:\/\/[^"']+?:(\d+)/.exec(vite)?.[1]);
if (!clientPort || !serverPort) {
  console.error(red("Non trovo le porte in client/vite.config.ts (server.port e proxy /api)."));
  process.exit(1);
}

const watch = !process.argv.includes("--no-watch");
const services = [
  { key: "server", label: "Back-end ", tag: magenta("[server]"), port: serverPort, script: watch ? "dev" : "start" },
  { key: "client", label: "Front-end", tag: cyan("[client]"), port: clientPort, script: "dev" },
];

const isPortOpen = (port) =>
  new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    socket.setTimeout(800);
    socket.once("connect", () => (socket.destroy(), resolve(true)));
    socket.once("timeout", () => (socket.destroy(), resolve(false)));
    socket.once("error", () => resolve(false));
  });

const lanAddresses = () =>
  Object.values(os.networkInterfaces())
    .flat()
    .filter((net) => net && net.family === "IPv4" && !net.internal)
    .map((net) => net.address);

const missing = services.filter((service) => !existsSync(path.join(root, service.key, "node_modules")));
if (missing.length) {
  console.error(red(`✖ Dipendenze mancanti in ${missing.map((service) => service.key).join(" e ")}: esegui prima ${bold("npm run install:all")}.`));
  process.exit(1);
}

const busy = [];
for (const service of services) if (await isPortOpen(service.port)) busy.push(service);
if (busy.length) {
  for (const service of busy)
    console.error(red(`✖ La porta ${service.port} (${service.label.trim()}) è già occupata: l'app è già avviata in un altro terminale?`));
  process.exit(1);
}

const startedAt = Date.now();
console.log(`\n  ${bold(appName)} ${dim("· avvio di back-end e front-end…")}`);
console.log(`  ${dim("Back-end ")} ${dim(`porta ${serverPort}`)}   ${dim("Front-end")} ${dim(`porta ${clientPort}`)}\n`);

let stopping = false;
const children = new Map();

const stopAll = (exitCode) => {
  if (stopping) return;
  stopping = true;
  for (const child of children.values()) {
    if (child.exitCode !== null || !child.pid) continue;
    if (isWin) spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    else child.kill("SIGINT");
  }
  setTimeout(() => process.exit(exitCode), 3000).unref();
  const check = setInterval(() => {
    if ([...children.values()].every((child) => child.exitCode !== null || child.signalCode !== null)) {
      clearInterval(check);
      process.exit(exitCode);
    }
  }, 100);
};

for (const service of services) {
  // Su Windows npm è un .cmd: serve la shell (comando unico, niente argomenti separati).
  const child = spawn(isWin ? `npm run ${service.script}` : "npm", isWin ? [] : ["run", service.script], {
    cwd: path.join(root, service.key),
    shell: isWin,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: color ? "1" : "0" },
  });
  children.set(service.key, child);
  for (const stream of [child.stdout, child.stderr])
    readline.createInterface({ input: stream }).on("line", (line) => console.log(`${service.tag} ${line}`));
  child.on("exit", (code) => {
    if (stopping) return;
    console.error(red(`\n✖ ${service.label.trim()} si è fermato (codice ${code ?? "?"}): chiudo anche l'altro.`));
    stopAll(code || 1);
  });
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"])
  process.on(signal, () => {
    if (!stopping) console.log(yellow("\n  Arresto di back-end e front-end…"));
    stopAll(0);
  });

// Quando entrambe le porte rispondono, riassunto finale con gli indirizzi.
const ready = new Set();
const poll = setInterval(async () => {
  if (stopping) return clearInterval(poll);
  for (const service of services)
    if (!ready.has(service.key) && (await isPortOpen(service.port))) ready.add(service.key);
  if (ready.size < services.length) return;
  clearInterval(poll);
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  const line = dim("  " + "─".repeat(52));
  console.log(`\n${line}`);
  console.log(`  ${green("✔")} ${bold(appName)} pronto in ${seconds}s\n`);
  console.log(`  ${cyan("➜")} Front-end  ${bold(`http://localhost:${clientPort}`)}`);
  for (const address of lanAddresses())
    console.log(`  ${cyan("➜")} Rete       ${`http://${address}:${clientPort}`}`);
  console.log(`  ${magenta("➜")} Back-end   ${bold(`http://localhost:${serverPort}`)} ${dim("(dal front-end via /api)")}`);
  console.log(`\n  ${dim("Ctrl+C per fermare entrambi")}`);
  console.log(`${line}\n`);
}, 700);
