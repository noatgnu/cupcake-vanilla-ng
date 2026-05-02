import { spawn, ChildProcess } from 'child_process';

let serverProcess: ChildProcess;

async function waitForServer(url: string, timeoutMs = 120000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

export default async function globalSetup(): Promise<void> {
  serverProcess = spawn('npx', ['ng', 'serve', 'cupcake-vanilla-ng', '--port', '4200', '--ssl=false'], {
    stdio: 'pipe',
    shell: true,
    detached: false,
  });

  (global as any).__E2E_SERVER_PID__ = serverProcess.pid;

  await waitForServer('http://localhost:4200');
}
