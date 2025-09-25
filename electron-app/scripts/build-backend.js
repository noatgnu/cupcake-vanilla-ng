const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building Python backend for Electron distribution...');

const backendDir = path.join(__dirname, '../backend');
const distDir = path.join(__dirname, '../backend-dist');

// Clean existing dist directory
if (fs.existsSync(distDir)) {
  console.log('Cleaning existing backend-dist directory...');
  fs.rmSync(distDir, { recursive: true, force: true });
}

// Create dist directory
fs.mkdirSync(distDir, { recursive: true });

// Check if Poetry is available
try {
  execSync('poetry --version', { stdio: 'ignore' });
  console.log('✓ Poetry found');
} catch (error) {
  console.error('✗ Poetry not found. Please install Poetry first.');
  console.error('Visit: https://python-poetry.org/docs/#installation');
  process.exit(1);
}

// Copy backend source files
console.log('Copying backend source files...');
const filesToCopy = [
  'ccc',
  'ccv',
  'ccm',
  'ccmc',
  'ccrv',
  'ccsc',
  'cupcake_vanilla',
  'manage.py',
  'pyproject.toml',
  'poetry.lock',
  '__init__.py'
];

filesToCopy.forEach(file => {
  const srcPath = path.join(backendDir, file);
  const destPath = path.join(distDir, file);

  if (fs.existsSync(srcPath)) {
    console.log(`Copying ${file}...`);
    if (fs.statSync(srcPath).isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
});

// Copy essential media files (schemas)
const mediaDir = path.join(backendDir, 'media');
const distMediaDir = path.join(distDir, 'media');
if (fs.existsSync(mediaDir)) {
  console.log('Copying media/schemas...');
  fs.mkdirSync(distMediaDir, { recursive: true });

  const schemasDir = path.join(mediaDir, 'schemas');
  const distSchemasDir = path.join(distMediaDir, 'schemas');
  if (fs.existsSync(schemasDir)) {
    fs.cpSync(schemasDir, distSchemasDir, { recursive: true });
  }
}

// Create electron-specific Django settings
console.log('Creating Electron-specific Django settings...');
const electronSettingsContent = `# Electron-specific Django settings
import os
from pathlib import Path

# Import base settings
import sys
sys.path.append(os.path.dirname(__file__))
from cupcake_vanilla.settings import *

# Override for Electron environment
DEBUG = False

# Use SQLite for Electron (embedded database)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(os.path.dirname(__file__), 'electron_data', 'db.sqlite3'),
    }
}

# Use fake Redis for Electron (no external Redis needed)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Disable Redis-dependent features
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# Static files for Electron
STATIC_ROOT = os.path.join(os.path.dirname(__file__), 'electron_data', 'static')
MEDIA_ROOT = os.path.join(os.path.dirname(__file__), 'electron_data', 'media')

# Allow all hosts for local Electron usage
ALLOWED_HOSTS = ['*']

# CORS settings for Electron
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Logging for Electron
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(os.path.dirname(__file__), 'electron_data', 'django.log'),
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# Create data directory if it doesn't exist
os.makedirs(os.path.join(os.path.dirname(__file__), 'electron_data'), exist_ok=True)
os.makedirs(STATIC_ROOT, exist_ok=True)
os.makedirs(MEDIA_ROOT, exist_ok=True)
`;

fs.writeFileSync(path.join(distDir, 'electron_settings.py'), electronSettingsContent);

// Create startup script for Electron
console.log('Creating backend startup script...');
const startupScriptContent = `#!/usr/bin/env python3
"""
Cupcake Vanilla Backend Startup Script for Electron
This script starts the Django server in a way that's suitable for Electron packaging.
"""
import os
import sys
import threading
import time
import socket
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'electron_settings')

def find_free_port(start_port=8000, max_attempts=100):
    """Find a free port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                return port
        except OSError:
            continue
    raise RuntimeError(f"Could not find a free port in range {start_port}-{start_port + max_attempts}")

def setup_django():
    """Initialize Django application"""
    try:
        import django
        from django.core.management import execute_from_command_line
        from django.core.management.base import CommandError

        django.setup()

        # Run migrations
        print("Running Django migrations...")
        try:
            execute_from_command_line(['manage.py', 'migrate', '--run-syncdb'])
        except CommandError as e:
            print(f"Migration warning: {e}")

        # Collect static files
        print("Collecting static files...")
        try:
            execute_from_command_line(['manage.py', 'collectstatic', '--noinput'])
        except CommandError as e:
            print(f"Static files warning: {e}")

        print("Django setup completed successfully!")
        return True

    except Exception as e:
        print(f"Django setup failed: {e}")
        return False

def start_server(port):
    """Start Django development server"""
    try:
        from django.core.management import execute_from_command_line
        print(f"Starting Django server on port {port}...")
        execute_from_command_line(['manage.py', 'runserver', f'127.0.0.1:{port}', '--noreload'])
    except Exception as e:
        print(f"Server failed to start: {e}")

def main():
    """Main function to start the backend"""
    print("Starting Cupcake Vanilla Backend for Electron...")

    # Setup Django
    if not setup_django():
        print("Failed to setup Django. Exiting.")
        sys.exit(1)

    # Find free port
    try:
        port = find_free_port()
        print(f"Using port {port} for backend server")

        # Write port to file for Electron to read
        port_file = backend_dir / 'server_port.txt'
        with open(port_file, 'w') as f:
            f.write(str(port))

        # Start server
        start_server(port)

    except Exception as e:
        print(f"Failed to start backend: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
`;

fs.writeFileSync(path.join(distDir, 'start_backend.py'), startupScriptContent);

// Make startup script executable on Unix systems
if (process.platform !== 'win32') {
  try {
    execSync(`chmod +x "${path.join(distDir, 'start_backend.py')}"`, { stdio: 'ignore' });
  } catch (error) {
    console.warn('Could not make startup script executable:', error.message);
  }
}

console.log('✓ Backend build completed successfully!');
console.log(`Backend files prepared in: ${distDir}`);