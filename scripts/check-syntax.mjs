import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const files = readdirSync(new URL(`..`, import.meta.url))
  .filter(file => file.endsWith(`.js`) || file.endsWith(`.cjs`))
  .sort();

const failures = [];
files.forEach(file => {
  const result = spawnSync(process.execPath, [`--check`, file], {
    cwd: new URL(`..`, import.meta.url),
    encoding: `utf8`
  });
  if (result.status !== 0) {
    failures.push(`${file}\n${result.stderr || result.stdout}`);
  }
});

if (failures.length) {
  console.error(failures.join(`\n\n`));
  process.exitCode = 1;
} else {
  console.log(`syntax-ok:${files.length}`);
}
