import { spawn, ChildProcess } from 'child_process';

let serverProcess: ChildProcess | null = null;

async function isServerUp(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer(url: string, timeoutMs = 120000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerUp(url)) return;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

export default async function globalSetup(): Promise<void> {
  if (await isServerUp('http://localhost:4200')) {
    (global as any).__E2E_SERVER_PID__ = null;
    return;
  }

  serverProcess = spawn('npx', ['ng', 'serve', 'cupcake-vanilla-ng', '--port', '4200', '--ssl=false'], {
    stdio: 'pipe',
    shell: true,
    detached: false,
  });

  (global as any).__E2E_SERVER_PID__ = serverProcess.pid;

  await waitForServer('http://localhost:4200');
}
