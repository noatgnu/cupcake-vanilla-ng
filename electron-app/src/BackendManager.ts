import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { BrowserWindow, ipcMain, dialog } from 'electron';

export interface BackendStatus {
  service: string;
  status: 'starting' | 'ready' | 'error';
  message: string;
}

export interface LogMessage {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export class BackendManager {
  private backendProcess: ChildProcess | null = null;
  private rqWorkerProcess: ChildProcess | null = null;
  private backendPort: number = 8000;
  private userDataPath: string;
  private isDev: boolean;
  private splashWindow: BrowserWindow | null = null;

  constructor(userDataPath: string, isDev: boolean) {
    this.userDataPath = userDataPath;
    this.isDev = isDev;
  }

  setSplashWindow(splashWindow: BrowserWindow) {
    this.splashWindow = splashWindow;
  }

  private sendBackendStatus(service: string, status: 'starting' | 'ready' | 'error', message: string): void {
    if (this.splashWindow && !this.splashWindow.isDestroyed()) {
      this.splashWindow.webContents.send('backend-status', { service, status, message });
    }
  }

  private sendBackendLog(message: string, type: string = 'info'): void {
    if (this.splashWindow && !this.splashWindow.isDestroyed()) {
      this.splashWindow.webContents.send('backend-log', { message, type });
    }
  }

  private getDjangoEnvironment(): NodeJS.ProcessEnv {
    return {
      ...process.env,
      DJANGO_SETTINGS_MODULE: 'cupcake_vanilla.settings_electron',
      ELECTRON_APP_DATA: this.userDataPath,
      ELECTRON_STATIC_ROOT: path.join(this.userDataPath, 'static'),
      ELECTRON_MEDIA_ROOT: path.join(this.userDataPath, 'media'),
      ELECTRON_DEBUG: this.isDev ? 'true' : 'false',
      PYTHONUNBUFFERED: '1'
    };
  }

  private classifyProcessOutput(output: string, isStderr: boolean = false): 'info' | 'warning' | 'error' | 'success' {
    const lowerOutput = output.toLowerCase();

    if (lowerOutput.includes('error:') ||
        lowerOutput.includes('exception') ||
        lowerOutput.includes('traceback') ||
        lowerOutput.includes('failed') ||
        lowerOutput.includes('critical:')) {
      return 'error';
    }

    if (lowerOutput.includes('watching for file changes') ||
        lowerOutput.includes('performing system checks') ||
        lowerOutput.includes('system check identified no issues') ||
        lowerOutput.includes('starting development server') ||
        lowerOutput.includes('quit the server') ||
        lowerOutput.includes('django version') ||
        lowerOutput.includes('autoreload')) {
      return 'info';
    }

    if (lowerOutput.includes('worker') && lowerOutput.includes('started with pid') ||
        lowerOutput.includes('*** listening on') ||
        lowerOutput.includes('worker rq:worker:') ||
        lowerOutput.includes('cleaning registries') ||
        lowerOutput.includes('subscribing to channel') ||
        lowerOutput.includes('worker registered successfully')) {
      return 'info';
    }

    if (lowerOutput.includes('warning:') ||
        lowerOutput.includes('deprecated') ||
        lowerOutput.includes('ignore')) {
      return 'warning';
    }

    if (lowerOutput.includes('successfully') ||
        lowerOutput.includes('completed') ||
        lowerOutput.includes('ready') ||
        lowerOutput.includes('started')) {
      return 'success';
    }

    return isStderr ? 'warning' : 'info';
  }

  async runMigrations(backendDir: string, venvPython: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.sendBackendStatus('migrations', 'starting', 'Running Django migrations...');
      this.sendBackendLog('Running Django migrations...');

      const migrationsProcess = spawn(venvPython, ['manage.py', 'migrate'], {
        cwd: backendDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: this.getDjangoEnvironment()
      });

      migrationsProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        this.sendBackendLog(`migrations: ${output}`, 'info');
      });

      migrationsProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        const messageType = this.classifyProcessOutput(output, true);
        this.sendBackendLog(`migrations: ${output}`, messageType);
      });

      migrationsProcess.on('close', (code) => {
        if (code === 0) {
          this.sendBackendStatus('migrations', 'ready', 'Migrations completed');
          this.sendBackendLog('Django migrations completed successfully', 'success');
        } else {
          this.sendBackendLog(`Migrations failed with exit code ${code}`, 'error');
          this.sendBackendStatus('migrations', 'error', 'Migrations failed');
        }
        resolve();
      });

      migrationsProcess.on('error', (error) => {
        this.sendBackendLog(`Migrations error: ${error.message}`, 'error');
        this.sendBackendStatus('migrations', 'error', 'Migrations failed');
        resolve();
      });
    });
  }

  async runDjangoShellCommand(backendDir: string, venvPython: string, pythonCode: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const process = spawn(venvPython, ['manage.py', 'shell', '-c', pythonCode], {
        cwd: backendDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: this.getDjangoEnvironment()
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Django shell command failed with code ${code}: ${errorOutput}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  async collectStaticFiles(backendDir: string, venvPython: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.sendBackendStatus('collectstatic', 'starting', 'Collecting static files...');
      this.sendBackendLog('Running collectstatic to gather Django static files...');

      const collectStaticProcess = spawn(venvPython, ['manage.py', 'collectstatic', '--noinput'], {
        cwd: backendDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: this.getDjangoEnvironment()
      });

      collectStaticProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        this.sendBackendLog(`collectstatic: ${output}`, 'info');
        this.sendBackendStatus('collectstatic', 'ready', 'Static files collected successfully');
      });

      collectStaticProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        const messageType = this.classifyProcessOutput(output, true);
        this.sendBackendLog(`collectstatic: ${output}`, messageType);
      });

      collectStaticProcess.on('close', (code) => {
        this.sendBackendLog('Static files collection completed', 'success');
        this.sendBackendStatus('collectstatic', 'ready', 'Static files collected');
        resolve();
      });

      collectStaticProcess.on('error', (error) => {
        this.sendBackendLog(`Static files collection error: ${error.message}`, 'error');
        resolve();
      });
    });
  }

  async startDjangoServer(backendDir: string, venvPython: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.sendBackendStatus('django', 'starting', 'Starting Django server...');
      this.sendBackendLog('Starting Django server...');

      this.backendPort = 8000;

      this.backendProcess = spawn(venvPython, ['manage.py', 'runserver', `127.0.0.1:${this.backendPort}`], {
        cwd: backendDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: this.getDjangoEnvironment()
      });

      this.backendProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        this.sendBackendLog(`django: ${output}`);

        if (output.includes('Starting development server') || output.includes('Django version')) {
          this.sendBackendStatus('django', 'ready', `Server running on port ${this.backendPort}`);
          this.sendBackendLog(`Django server ready on http://127.0.0.1:${this.backendPort}`, 'success');
          resolve();
        }
      });

      this.backendProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        const messageType = this.classifyProcessOutput(output, true);
        this.sendBackendLog(`django: ${output}`, messageType);
      });

      this.backendProcess.on('close', (code) => {
        this.sendBackendLog(`Django server exited with code ${code}`, 'error');
        this.backendProcess = null;
      });

      this.backendProcess.on('error', (error) => {
        this.sendBackendStatus('django', 'error', `Server start error: ${error.message}`);
        this.sendBackendLog(`Django server error: ${error.message}`, 'error');
        resolve();
      });
    });
  }

  async startRQWorker(backendDir: string, venvPython: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.sendBackendStatus('rq', 'starting', 'Starting RQ worker...');
      this.sendBackendLog('Starting RQ worker...');

      let hasOutput = false;
      let resolved = false;

      this.rqWorkerProcess = spawn(venvPython, ['manage.py', 'rqworker', 'default'], {
        cwd: backendDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: this.getDjangoEnvironment()
      });

      // Set a timeout to resolve after a reasonable period if the process is running
      const timeout = setTimeout(() => {
        if (!resolved && this.rqWorkerProcess && !this.rqWorkerProcess.killed) {
          resolved = true;
          this.sendBackendStatus('rq', 'ready', 'RQ worker started');
          this.sendBackendLog('RQ worker ready (process running)', 'success');
          resolve();
        }
      }, 3000); // 3 second timeout

      this.rqWorkerProcess.stdout.on('data', (data) => {
        hasOutput = true;
        const output = data.toString().trim();
        const messageType = this.classifyProcessOutput(output, false);
        this.sendBackendLog(`rq stdout: ${output}`, messageType);

        // Check for common RQ worker ready indicators
        if (!resolved && (
          output.includes('Worker started') ||
          output.includes('started with PID') ||
          output.includes('*** Listening on') ||
          output.includes('Listening on')
        )) {
          resolved = true;
          clearTimeout(timeout);
          this.sendBackendStatus('rq', 'ready', 'RQ worker started');
          this.sendBackendLog('RQ worker ready', 'success');
          resolve();
        }
      });

      this.rqWorkerProcess.stderr.on('data', (data) => {
        hasOutput = true;
        const output = data.toString().trim();
        const messageType = this.classifyProcessOutput(output, true);
        this.sendBackendLog(`rq stderr: ${output}`, messageType);

        // RQ workers often output startup info to stderr
        if (!resolved && (
          output.includes('Worker started') ||
          output.includes('started with PID') ||
          output.includes('*** Listening on') ||
          output.includes('Listening on') ||
          output.includes('Worker rq:worker:') ||
          output.includes('Cleaning registries') ||
          output.includes('Subscribing to channel')
        )) {
          resolved = true;
          clearTimeout(timeout);
          this.sendBackendStatus('rq', 'ready', 'RQ worker started');
          this.sendBackendLog('RQ worker ready', 'success');
          resolve();
        }
      });

      this.rqWorkerProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          this.sendBackendLog(`RQ worker exited with code ${code}`, 'error');
          this.sendBackendStatus('rq', 'error', `RQ worker failed with code ${code}`);
        } else {
          this.sendBackendLog(`RQ worker exited with code ${code}`, 'warning');
        }
        this.rqWorkerProcess = null;
      });

      this.rqWorkerProcess.on('error', (error) => {
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          this.sendBackendStatus('rq', 'error', `RQ worker error: ${error.message}`);
          this.sendBackendLog(`RQ worker error: ${error.message}`, 'error');
        }
        resolve();
      });
    });
  }

  stopServices(): void {
    if (this.backendProcess) {
      console.log('Stopping Django server...');
      this.backendProcess.kill('SIGTERM');
      this.backendProcess = null;
    }
    if (this.rqWorkerProcess) {
      console.log('Stopping RQ worker...');
      this.rqWorkerProcess.kill('SIGTERM');
      this.rqWorkerProcess = null;
    }
  }

  getBackendPort(): number {
    return this.backendPort;
  }

}
