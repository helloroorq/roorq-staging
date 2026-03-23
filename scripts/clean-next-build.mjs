import { rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import process from 'node:process';

const TARGETS = ['.next', '.next-dev'];

const runWindowsFallback = (target) =>
  new Promise((resolve, reject) => {
    const child = spawn('cmd', ['/c', 'rd', '/s', '/q', target], {
      stdio: 'ignore',
      shell: false,
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0 || code === 2) {
        resolve();
        return;
      }
      reject(new Error(`rd exited with code ${code}`));
    });
  });

const clean = async () => {
  for (const target of TARGETS) {
    try {
      await rm(target, { recursive: true, force: true });
    } catch (error) {
      if (process.platform === 'win32') {
        await runWindowsFallback(target);
        continue;
      }
      throw error;
    }
  }
};

await clean();
