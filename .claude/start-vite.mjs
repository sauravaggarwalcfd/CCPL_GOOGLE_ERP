import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', 'frontend');
const port = process.env.PORT || '9090';
const args = ['node_modules/vite/bin/vite.js', '--port', port, ...process.argv.slice(2)];

const child = spawn('node', args, { cwd: root, stdio: 'inherit', env: { ...process.env } });
child.on('exit', (code) => process.exit(code ?? 0));
