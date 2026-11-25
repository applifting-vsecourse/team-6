// Runs tests_selenium/<script>.sh on macOS and Linux, or <script>.bat on Windows, with the
// remaining arguments. The pnpm scripts call this, so `pnpm test:selenium` works on both.
//
//   node tests_selenium/launch.cjs run [args...]
//   node tests_selenium/launch.cjs setup

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const [script, ...args] = process.argv.slice(2);
if (!['run', 'setup'].includes(script)) {
  console.error('usage: node tests_selenium/launch.cjs run|setup [args...]');
  process.exit(2);
}

// cmd.exe: quote an argument that has spaces or characters cmd would act on.
const quote = (arg) =>
  /[\s"&|<>^()]/.test(arg) ? `"${arg.replace(/"/g, '""')}"` : arg;

const result =
  process.platform === 'win32'
    ? // A .bat file can only be started through the shell.
      spawnSync(
        [quote(path.join(__dirname, `${script}.bat`)), ...args.map(quote)].join(
          ' ',
        ),
        {
          stdio: 'inherit',
          shell: true,
        },
      )
    : spawnSync('bash', [path.join(__dirname, `${script}.sh`), ...args], {
        stdio: 'inherit',
      });

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
