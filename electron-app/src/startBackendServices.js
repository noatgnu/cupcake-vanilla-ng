// Start backend services with existing configuration
async function startBackendServices(pythonPath) {
  try {
    sendBackendLog('Initializing Cupcake Vanilla backend services...', 'info');

    // Set global python path
    global.pythonPath = pythonPath;
    sendBackendStatus('python', 'ready', `Using Python: ${pythonPath}`);

    // Get existing virtual environment
    const venvPath = checkVirtualEnvironment();
    if (!venvPath) {
      sendBackendStatus('venv', 'error', 'Virtual environment not found');
      dialog.showErrorBox('Virtual Environment Error', 'Virtual environment not found. Please reconfigure.');
      return;
    }
    sendBackendStatus('venv', 'ready', 'Using existing virtual environment');
    sendBackendLog('Using existing virtual environment', 'success');

    const backendDir = path.join(__dirname, '..', 'backend');

    // Start all backend services
    await installDependencies(backendDir, venvPath);
    await runDjangoMigrations(backendDir, venvPath);
    await collectStaticFiles(backendDir, venvPath);
    await startDjangoServer(backendDir, venvPath);
    await startRQWorker(backendDir, venvPath);

    // All services ready - auto-transition to main app
    sendBackendLog('All services started successfully!', 'success');

    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        console.log('Auto-transitioning to main application...');
        splashWindow.close();
        createWindow();
      }
    }, 1500);

  } catch (error) {
    console.error('Backend services error:', error);
    sendBackendLog(`Backend services error: ${error.message}`, 'error');
    dialog.showErrorBox('Backend Error', `Failed to start backend services: ${error.message}`);
  }
}

module.exports = { startBackendServices };