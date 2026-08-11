import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('direct content editing workflow', () => {
  it('does not regenerate generatedContent.ts during dev or build', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    );

    expect(packageJson.scripts.dev).not.toContain('extract-content');
    expect(packageJson.scripts.build).not.toContain('extract-content');
  });

  it('uses the live Vite server in the local preview launcher', () => {
    const launcher = readFileSync(
      resolve(process.cwd(), '打开网站预览.cmd'),
      'utf8',
    );

    expect(launcher).not.toContain(' preview ');
    expect(launcher).toContain(' --host 127.0.0.1 --port 4173');
  });
});
