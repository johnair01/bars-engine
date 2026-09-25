import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gameDir = path.join(root, 'understood-game');

if (process.env.SKIP_UNDERSTOOD_BUILD === '1') {
  console.warn('Skipping Understood build.');
  process.exit(0);
}

const run = (command) => execSync(command, { cwd: gameDir, stdio: 'inherit', shell: true });

run('npm ci --include=dev --no-audit --no-fund');
run('npm run build');
console.log('Understood built into public/understood-app');
