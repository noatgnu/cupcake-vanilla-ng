import { execSync } from 'child_process';

export default async function globalTeardown(): Promise<void> {
  const pid = (global as any).__E2E_SERVER_PID__;
  if (pid) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    }
  }
}
