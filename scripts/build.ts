import { existsSync, mkdirSync, readdirSync, readlinkSync, symlinkSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

const root = resolve(import.meta.dir, "..");
const target = process.argv[2];
if (target !== "sim" && target !== "ipod") throw new Error("Use sim or ipod");
const build = join(root, "out", target);
const env = { ...process.env, PATH: `${join(homedir(), "rbdev/bin")}:${process.env.PATH}` };
function run(cmd: string[], cwd = build) {
  const result = Bun.spawnSync(cmd, { cwd, env, stdin: "inherit", stdout: "inherit", stderr: "inherit" });
  if (result.exitCode !== 0) process.exit(result.exitCode || 1);
}
function link(source: string, destination: string) {
  mkdirSync(resolve(destination, ".."), { recursive: true });
  try {
    if (readlinkSync(destination) === source) return;
    unlinkSync(destination);
  } catch (error: any) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    symlinkSync(source, destination);
  } catch (error: any) {
    if (error.code !== "EEXIST" || readlinkSync(destination) !== source) throw error;
  }
}

// Rockbox's build expects application sources under apps/. Mount individual
// host files there without changing its dependency and object-path rules.
for (const file of readdirSync(join(root, "host"), { withFileTypes: true })) {
  if (file.isFile()) link(`../../../host/${file.name}`, join(root, "system/apps/classicos", file.name));
}
link(root + "/runtime", root + "/shell/node_modules/@pocketjs/framework");
link(root + "/runtime/node_modules/solid-js", root + "/shell/node_modules/solid-js");
if (!existsSync(root + "/runtime/node_modules/typescript/package.json")) {
  throw new Error("Install dependencies with bun install first");
}
mkdirSync(build, { recursive: true });
if (!existsSync(join(build, "Makefile"))) {
  run([root + "/scripts/configure.sh", "--target=ipodvideo", `--type=${target === "sim" ? "s" : "n"}`]);
}
run(["make", "-j4", ...process.argv.slice(3).filter(arg => arg !== "--run")]);
if (target === "sim") run(["make", "install"]);
if (process.argv.includes("--run")) {
  if (target !== "sim") throw new Error("--run requires sim");
  run(["./rockboxui"]);
}
