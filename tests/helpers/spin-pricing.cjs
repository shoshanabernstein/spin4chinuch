/* eslint-disable @typescript-eslint/no-require-imports -- Shared CommonJS test fixture. */
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const testModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/spin-pricing.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: testModule.exports, module: testModule });
module.exports = testModule.exports;
