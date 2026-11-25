import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as ts from 'typescript';

// Story #177 guard: a logger or console call must not be given an e-mail address. It checks whole
// call expressions with the TypeScript parser, so a call that Prettier wrapped over several lines
// is treated the same as a one-liner. Anything passed through `redact*` or `mask*` is fine.
// Not exhaustive (an address in a variable with an innocent name gets through); redaction in
// `redact.ts` is the real protection.

const LOG_METHODS = new Set([
  'log',
  'warn',
  'error',
  'debug',
  'verbose',
  'info',
]);
const SAFE_WRAPPER = /^(redact|mask)/i;

const isLogCall = (call: ts.CallExpression): boolean => {
  const callee = call.expression;
  if (!ts.isPropertyAccessExpression(callee)) return false;
  if (!LOG_METHODS.has(callee.name.text)) return false;
  const target = callee.expression;
  const name = ts.isPropertyAccessExpression(target)
    ? target.name.text
    : ts.isIdentifier(target)
      ? target.text
      : '';
  return /^(logger|console)$/i.test(name);
};

const mentionsEmail = (node: ts.Node): boolean => {
  if (ts.isCallExpression(node)) {
    const callee = node.expression;
    const name = ts.isIdentifier(callee)
      ? callee.text
      : ts.isPropertyAccessExpression(callee)
        ? callee.name.text
        : '';
    if (SAFE_WRAPPER.test(name)) return false;
  }
  if (ts.isIdentifier(node) && (/email/i.test(node.text) || node.text === 'to'))
    return true;
  return ts.forEachChild(node, mentionsEmail) ?? false;
};

/** `line` of each logger or console call in the source that is given an e-mail address. */
export const emailLogCalls = (source: string): number[] => {
  const file = ts.createSourceFile(
    'x.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const found: number[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      isLogCall(node) &&
      node.arguments.some(mentionsEmail)
    ) {
      found.push(file.getLineAndCharacterOfPosition(node.getStart()).line + 1);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
};

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

describe('emailLogCalls (the guard itself)', () => {
  it('catches a one-line call', () => {
    expect(emailLogCalls('this.logger.log(`sent to ${user.email}`);')).toEqual([
      1,
    ]);
  });

  it('catches a call that Prettier wrapped over several lines', () => {
    const source = [
      'class A {',
      '  run(user) {',
      '    this.logger.error(',
      '      `Delivery failed for ${user.email}`,',
      '    );',
      '  }',
      '}',
    ].join('\n');
    expect(emailLogCalls(source)).toEqual([3]);
  });

  it('catches the recipient parameter and console calls', () => {
    expect(emailLogCalls('send(to) { console.warn("to", to); }')).toEqual([1]);
  });

  it('allows an address that goes through a redact or mask helper, wrapped or not', () => {
    const source = [
      'this.logger.error(',
      '  `Failed for ${maskEmail(to)}: ${redactEmails(reason)}`,',
      ');',
      'console.log(redactedLogLine(message, args));',
    ].join('\n');
    expect(emailLogCalls(source)).toEqual([]);
  });

  it('ignores calls that are not logging', () => {
    expect(emailLogCalls('mailer.send(user.email); repo.log(email);')).toEqual(
      [],
    );
  });
});

describe('logging', () => {
  it('never passes an e-mail address to a logger or console call', () => {
    const offenders = sourceFiles(root).flatMap((file) =>
      emailLogCalls(readFileSync(file, 'utf8')).map(
        (line) => `${file.replace(root, 'src')}:${line}`,
      ),
    );
    expect(offenders).toEqual([]);
  });
});
