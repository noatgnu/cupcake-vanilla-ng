const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');
const envExamplePath = path.join(projectRoot, '.env.example');

function expandPath(p) {
  if (p.startsWith('~')) {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}

function loadEnv() {
  const envFile = fs.existsSync(envPath) ? envPath : envExamplePath;

  if (!fs.existsSync(envFile)) {
    console.error('No .env or .env.example file found');
    process.exit(1);
  }

  const content = fs.readFileSync(envFile, 'utf-8');
  const env = {};

  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

const env = loadEnv();

const sslKey = expandPath(env.EXCEL_ADDIN_SSL_KEY || '~/.office-addin-dev-certs/localhost.key');
const sslCert = expandPath(env.EXCEL_ADDIN_SSL_CERT || '~/.office-addin-dev-certs/localhost.crt');

if (!fs.existsSync(sslKey)) {
  console.error(`SSL key not found: ${sslKey}`);
  console.error('Run: npx office-addin-dev-certs install');
  process.exit(1);
}

if (!fs.existsSync(sslCert)) {
  console.error(`SSL certificate not found: ${sslCert}`);
  console.error('Run: npx office-addin-dev-certs install');
  process.exit(1);
}

const args = [
  'serve',
  'cupcake-excel-addin',
  '--ssl',
  '--ssl-key', sslKey,
  '--ssl-cert', sslCert,
  ...process.argv.slice(2)
];

console.log(`Starting Excel Add-in dev server...`);
console.log(`SSL Key: ${sslKey}`);
console.log(`SSL Cert: ${sslCert}`);

const ng = spawn('npx', ['ng', ...args], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '../../..'),
  shell: true
});

ng.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

ng.on('close', (code) => {
  process.exit(code);
});
