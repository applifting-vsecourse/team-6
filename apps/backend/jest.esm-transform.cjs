// better-auth ships ESM-only (.mjs) and Jest runs CommonJS, so those files are
// converted on the fly. Everything else still goes through ts-jest.
const { transformSync } = require('esbuild');

module.exports = {
  process(source, filename) {
    return {
      code: transformSync(source, {
        format: 'cjs',
        // Jest cannot run import() without --experimental-vm-modules; turn it
        // into require() (better-auth imports node:async_hooks that way).
        supported: { 'dynamic-import': false },
        sourcefile: filename,
        sourcemap: 'inline',
      }).code,
    };
  },
};
