import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Story #177 guard: a log call must not interpolate an e-mail address. Not exhaustive, it catches
// the obvious regression (`logger.log(\`... ${user.email}\`)`); errors go through redactedError.

const root = join(__dirname, '..', '..');
const skip = ['generated', 'scripts'];

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory())
      return skip.includes(entry.name) ? [] : sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.spec.ts')
      ? [path]
      : [];
  });

describe('logging', () => {
  it('never passes an e-mail address to a logger or console call', () => {
    const offenders = sourceFiles(root).flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .map((line, index) => ({ file, line, number: index + 1 }))
        .filter(
          ({ line }) =>
            /(logger|console)\.\w+\(/i.test(line) &&
            /\b(email|\bto\b\s*[,)}$])/i.test(
              line.replace(/(redact|mask)\w*/gi, ''),
            ),
        )
        .map(({ file, number }) => `${file.replace(root, 'src')}:${number}`),
    );
    expect(offenders).toEqual([]);
  });
});
