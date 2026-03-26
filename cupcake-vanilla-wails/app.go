package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/noatgnu/cupcake-vanilla-wails/backend/models"
	"github.com/noatgnu/cupcake-vanilla-wails/backend/services"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

type App struct {
	ctx                    context.Context
	wailsApp               *application.App
	splashWindow           *application.WebviewWindow
	mainWindow             *application.WebviewWindow
	pythonSelectionWindow  *application.WebviewWindow
	downloaderWindow       *application.WebviewWindow
	managementWindow       *application.WebviewWindow
	debugWindow            *application.WebviewWindow
	superuserWindow        *application.WebviewWindow
	db                     *services.DatabaseService
	pythonManager          *services.PythonManager
	backendManager         *services.BackendManager
	redisManager           *services.RedisManager
	userManager            *services.UserManager
	downloader             *services.DownloadManager
	processTracker         *services.ProcessTracker
	logHandler             *services.LogHandler
	windowManager          *services.WindowManager
	logFilePath            string
	backendReady           bool
	venvPath               string
	userDataPath           string
	isDev                  bool
	initialized            chan struct{}
}

func NewApp() *App {
	userDataPath, err := getUserDataPath()
	if err != nil {
		log.Printf("Failed to get user data path: %v", err)
		userDataPath = "."
	}

	isDev := os.Getenv("WAILS_ENV") == "development"

	return &App{
		userDataPath: userDataPath,
		isDev:        isDev,
		initialized:  make(chan struct{}),
	}
}

func (a *App) WaitForInitialization(timeout time.Duration) bool {
	select {
	case <-a.initialized:
		return true
	case <-time.After(timeout):
		return false
	}
}

func (a *App) IsInitialized() bool {
	select {
	case <-a.initialized:
		return true
	default:
		return false
	}
}

func getUserDataPath() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dataPath := filepath.Join(configDir, "cupcake-vanilla")
	if err := os.MkdirAll(dataPath, 0755); err != nil {
		return "", err
	}
	return dataPath, nil
}

func (a *App) SetApplication(wailsApp *application.App) {
	a.wailsApp = wailsApp
}

func (a *App) SetSplashWindow(window *application.WebviewWindow) {
	a.splashWindow = window
}

func (a *App) SetLogFilePath(path string) {
	a.logFilePath = path
}

func (a *App) InitializeBackend() {
	log.Println("[App.InitializeBackend] Waiting for frontend to be ready...")
	time.Sleep(2 * time.Second)
	log.Println("[App.InitializeBackend] Starting backend initialization...")

	a.sendBackendLog("Initializing database...", "info")
	var err error
	a.db, err = services.NewDatabaseService(a.userDataPath)
	if err != nil {
		log.Printf("[App.InitializeBackend] Failed to initialize database: %v", err)
		a.sendBackendLog(fmt.Sprintf("Database error: %v", err), "error")
		return
	}
	a.sendBackendStatus("database", "ready", "Database initialized")

	a.logHandler = services.NewLogHandler(a.userDataPath)
	a.processTracker = services.NewProcessTracker(a.userDataPath)
	a.pythonManager = services.NewPythonManager(a.userDataPath)
	a.pythonManager.SetLogCallback(func(message string, msgType string) {
		a.sendBackendLog(fmt.Sprintf("python: %s", message), msgType)
	})
	a.downloader = services.NewDownloadManager()

	a.redisManager = services.NewRedisManager(services.RedisManagerOptions{
		UserDataPath: a.userDataPath,
		IsDev:        a.isDev,
	})

	a.redisManager.SetLogCallback(func(message string, msgType string) {
		a.sendBackendLog(fmt.Sprintf("redis: %s", message), msgType)
	})

	a.backendManager = services.NewBackendManager(a.userDataPath, a.isDev, a.redisManager)
	a.backendManager.SetLogCallback(func(message string, msgType string) {
		a.sendBackendLog(message, msgType)
	})
	a.backendManager.SetStatusCallback(func(service, status, message string) {
		a.sendBackendStatus(service, status, message)
	})

	a.userManager = services.NewUserManager(a.backendManager, a.userDataPath, a.isDev)

	close(a.initialized)
	log.Println("[App.InitializeBackend] Core managers initialized")

	a.sendBackendLog("Checking backend configuration...", "info")
	backendPath := a.getBackendPath()
	backendDownloader := services.NewBackendDownloader(nil)
	config := a.pythonManager.LoadConfig()

	if !backendDownloader.BackendExists(backendPath) {
		a.sendBackendLog("Backend not found, setup required", "warning")
		a.showBackendDownloadDialog()
		return
	}

	isPortable := backendDownloader.IsPortableBackend(backendPath)

	if isPortable {
		portablePython := a.getPortablePythonPath(backendPath)
		if _, err := os.Stat(portablePython); err == nil {
			a.sendBackendLog("Using portable backend with bundled Python", "success")
			config.DistributionType = models.DistributionPortable
			a.pythonManager.SaveConfig(config)
			a.startBackendServices(false, portablePython)
			return
		}
	}

	if config.DistributionType == models.DistributionNative && config.VenvPath != "" {
		if _, err := os.Stat(config.VenvPath); err == nil {
			a.sendBackendLog(fmt.Sprintf("Using native distribution with venv: %s", config.VenvPath), "success")
			a.startBackendServices(false, config.VenvPath)
			return
		}
	}

	hasValidConfig := a.pythonManager.IsConfigurationValid()
	if hasValidConfig {
		a.sendBackendLog(fmt.Sprintf("Using saved Python: %s", config.PythonPath), "success")
		a.startBackendServices(false, config.PythonPath)
	} else {
		a.showPythonSelectionDialog()
	}
}

func (a *App) startBackendServices(createNewVenv bool, pythonPath string) {
	log.Println("[App.startBackendServices] Starting backend services...")

	if pythonPath == "" {
		a.sendBackendStatus("python", "error", "No Python selected")
		return
	}

	a.sendBackendStatus("python", "ready", fmt.Sprintf("Using Python: %s", pythonPath))

	config := a.pythonManager.LoadConfig()
	config.PythonPath = pythonPath
	a.pythonManager.SaveConfig(config)

	backendDir := a.getBackendPath()
	if _, err := os.Stat(backendDir); os.IsNotExist(err) {
		a.sendBackendLog(fmt.Sprintf("Backend directory not found: %s", backendDir), "error")
		return
	}

	a.sendBackendLog(fmt.Sprintf("Using backend directory: %s", backendDir), "info")

	backendDownloader := services.NewBackendDownloader(nil)
	isPortable := backendDownloader.IsPortableBackend(backendDir)

	if isPortable {
		a.venvPath = pythonPath
		a.sendBackendStatus("venv", "ready", "Using portable virtual environment")
		a.sendBackendLog("Using bundled portable virtual environment", "success")
	} else if createNewVenv {
		a.sendBackendStatus("venv", "starting", "Creating virtual environment...")
		venvPython, err := a.pythonManager.CreateVirtualEnvironment(pythonPath)
		if err != nil {
			a.sendBackendStatus("venv", "error", fmt.Sprintf("Virtual environment creation failed: %v", err))
			return
		}
		a.venvPath = venvPython
		a.sendBackendStatus("venv", "ready", "Virtual environment created")
	} else {
		venvPath := a.pythonManager.CheckVirtualEnvironment()
		if venvPath == "" {
			a.sendBackendStatus("venv", "error", "No existing virtual environment found")
			return
		}
		a.venvPath = venvPath
		a.sendBackendStatus("venv", "ready", "Using existing virtual environment")
	}

	if !isPortable {
		a.sendBackendStatus("dependencies", "starting", "Installing Python dependencies...")
		requirementsPath := filepath.Join(backendDir, "requirements.txt")
		if err := a.pythonManager.InstallDependencies(a.venvPath, requirementsPath); err != nil {
			a.sendBackendStatus("dependencies", "error", fmt.Sprintf("Dependency installation failed: %v", err))
			return
		}
		a.sendBackendStatus("dependencies", "ready", "Dependencies installed")
	} else {
		a.sendBackendLog("Skipping dependency installation for portable backend", "info")
		a.sendBackendStatus("dependencies", "ready", "Dependencies pre-installed")
	}

	a.sendBackendStatus("migrations", "starting", "Running Django migrations...")
	if err := a.backendManager.RunMigrations(backendDir, a.venvPath); err != nil {
		a.sendBackendLog(fmt.Sprintf("Migration error: %v", err), "error")
	}
	a.sendBackendStatus("migrations", "ready", "Migrations completed")

	a.sendBackendStatus("collectstatic", "starting", "Collecting static files...")
	if err := a.backendManager.CollectStaticFiles(backendDir, a.venvPath); err != nil {
		a.sendBackendLog(fmt.Sprintf("Static files error: %v", err), "warning")
	}
	a.sendBackendStatus("collectstatic", "ready", "Static files collected")

	a.sendBackendLog("Cleaning up orphaned processes...", "info")
	a.backendManager.KillOrphanedProcesses()

	a.sendBackendStatus("redis", "starting", "Starting Redis server...")
	if err := a.backendManager.StartRedisServer(); err != nil {
		if services.IsRedisNotFoundError(err) {
			a.sendBackendLog("Redis/Valkey not found, prompting for download...", "warning")
			a.showValkeyDownloadDialog()
			return
		}
		a.sendBackendStatus("redis", "error", fmt.Sprintf("Redis error: %v", err))
		return
	}
	a.sendBackendStatus("redis", "ready", "Redis server started")

	a.sendBackendStatus("django", "starting", "Starting Django server...")
	if err := a.backendManager.StartDjangoServer(backendDir, a.venvPath); err != nil {
		a.sendBackendStatus("django", "error", fmt.Sprintf("Django error: %v", err))
		return
	}
	a.sendBackendStatus("django", "ready", fmt.Sprintf("Server running on port %d", a.backendManager.GetBackendPort()))

	a.sendBackendStatus("rq", "starting", "Starting RQ worker...")
	if err := a.backendManager.StartRQWorker(backendDir, a.venvPath); err != nil {
		a.sendBackendStatus("rq", "error", fmt.Sprintf("RQ worker error: %v", err))
		return
	}
	a.sendBackendStatus("rq", "ready", "RQ worker started")

	a.sendBackendLog("All services started successfully!", "success")
	a.backendReady = true

	a.transitionToMainWindow()
}

func (a *App) transitionToMainWindow() {
	log.Println("[App.transitionToMainWindow] Transitioning to main application...")

	a.mainWindow = a.wailsApp.Window.New()
	a.mainWindow.SetTitle("Cupcake Vanilla")
	a.mainWindow.SetSize(1200, 800)
	a.mainWindow.SetMinSize(800, 600)
	a.mainWindow.SetURL("/")

	a.mainWindow.Show()

	time.Sleep(500 * time.Millisecond)

	if a.splashWindow != nil {
		a.splashWindow.Close()
	}

	go a.checkAndHandleUsers()
}

func (a *App) checkAndHandleUsers() {
	if a.userManager == nil {
		return
	}

	backendDir := a.getBackendPath()
	config := a.pythonManager.LoadConfig()

	if config.PythonPath != "" && a.venvPath != "" {
		userCount, err := a.userManager.GetUserCount(backendDir, a.venvPath)
		if err != nil {
			log.Printf("[App] Error checking users: %v", err)
			return
		}

		if userCount == 0 {
			a.showSuperuserCreationModal()
		}
	}
}

func (a *App) showBackendDownloadDialog() {
	log.Println("[App] Opening backend download window...")

	if a.downloaderWindow != nil {
		a.downloaderWindow.Focus()
		return
	}

	a.downloaderWindow = a.wailsApp.Window.New()
	a.downloaderWindow.SetTitle("Download Backend")
	a.downloaderWindow.SetSize(500, 400)
	a.downloaderWindow.SetMinSize(400, 300)
	a.downloaderWindow.SetURL("/setup/#/downloader?type=backend")

	a.downloaderWindow.OnWindowEvent(events.Common.WindowClosing, func(e *application.WindowEvent) {
		a.downloaderWindow = nil
	})

	a.downloaderWindow.Show()
}

func (a *App) showPythonSelectionDialog() {
	log.Println("[App] Opening Python selection window...")

	if a.pythonSelectionWindow != nil {
		a.pythonSelectionWindow.Focus()
		return
	}

	a.pythonSelectionWindow = a.wailsApp.Window.New()
	a.pythonSelectionWindow.SetTitle("Select Python")
	a.pythonSelectionWindow.SetSize(520, 450)
	a.pythonSelectionWindow.SetMinSize(400, 350)
	a.pythonSelectionWindow.SetURL("/setup/#/python-selection")

	a.pythonSelectionWindow.OnWindowEvent(events.Common.WindowClosing, func(e *application.WindowEvent) {
		a.pythonSelectionWindow = nil
	})

	a.pythonSelectionWindow.Show()
}

func (a *App) showValkeyDownloadDialog() {
	log.Println("[App] Opening Valkey download window...")

	if a.downloaderWindow != nil {
		a.downloaderWindow.Focus()
		return
	}

	a.downloaderWindow = a.wailsApp.Window.New()
	a.downloaderWindow.SetTitle("Download Valkey")
	a.downloaderWindow.SetSize(500, 400)
	a.downloaderWindow.SetMinSize(400, 300)
	a.downloaderWindow.SetURL("/setup/#/downloader?type=valkey")

	a.downloaderWindow.OnWindowEvent(events.Common.WindowClosing, func(e *application.WindowEvent) {
		a.downloaderWindow = nil
	})

	a.downloaderWindow.Show()
}

func (a *App) showSuperuserCreationModal() {
	log.Println("[App] Opening superuser creation window...")

	if a.superuserWindow != nil {
		a.superuserWindow.Focus()
		return
	}

	a.superuserWindow = a.wailsApp.Window.New()
	a.superuserWindow.SetTitle("Create Admin Account")
	a.superuserWindow.SetSize(450, 400)
	a.superuserWindow.SetMinSize(400, 350)
	a.superuserWindow.SetURL("/setup/#/superuser-creation")

	a.superuserWindow.OnWindowEvent(events.Common.WindowClosing, func(e *application.WindowEvent) {
		a.superuserWindow = nil
	})

	a.superuserWindow.Show()
}

func (a *App) sendBackendStatus(service, status, message string) {
	log.Printf("[%s] %s: %s", service, status, message)
	if a.wailsApp == nil {
		log.Println("[sendBackendStatus] ERROR: wailsApp is nil!")
		return
	}
	if a.wailsApp.Event == nil {
		log.Println("[sendBackendStatus] ERROR: wailsApp.Event is nil!")
		return
	}
	statusData := models.BackendStatus{
		Service: service,
		Status:  status,
		Message: message,
	}
	log.Printf("[sendBackendStatus] Emitting backend:status event: %+v", statusData)
	result := a.wailsApp.Event.Emit("backend:status", statusData)
	log.Printf("[sendBackendStatus] Emit result: %v", result)
}

func (a *App) sendBackendLog(message, msgType string) {
	log.Printf("[LOG] [%s] %s", msgType, message)
	if a.logHandler != nil {
		a.logHandler.WriteLog(message, msgType)
	}
	logData := models.LogMessage{
		Message: message,
		Type:    msgType,
	}
	a.wailsApp.Event.Emit("backend:log", logData)
}

func (a *App) getBackendPath() string {
	return filepath.Join(a.userDataPath, "backend")
}

func (a *App) getPortablePythonPath(backendPath string) string {
	if runtime.GOOS == "windows" {
		return filepath.Join(backendPath, "python", "python.exe")
	}
	return filepath.Join(backendPath, "python", "bin", "python3")
}

func (a *App) Shutdown() {
	log.Println("[App.Shutdown] Shutting down...")

	if a.backendManager != nil {
		a.backendManager.StopServices()
	}

	if a.db != nil {
		a.db.Close()
	}

	log.Println("[App.Shutdown] Shutdown complete")
}

func (a *App) GetAppVersion() string {
	return "0.0.1"
}

func (a *App) TestEventEmit() bool {
	log.Println("[TestEventEmit] Testing event emission...")
	if a.wailsApp == nil {
		log.Println("[TestEventEmit] wailsApp is nil")
		return false
	}
	result := a.wailsApp.Event.Emit("test:ping", map[string]string{"message": "pong"})
	log.Printf("[TestEventEmit] Emit result: %v", result)
	return result
}

func (a *App) GetBackendPort() int {
	if a.backendManager != nil {
		return a.backendManager.GetBackendPort()
	}
	return 8000
}

func (a *App) IsBackendReady() bool {
	return a.backendReady
}

func (a *App) DetectPythonCandidates() []models.PythonCandidate {
	if a.pythonManager != nil {
		return a.pythonManager.DetectPythonCandidates()
	}
	return nil
}

func (a *App) VerifyPython(path string) models.ValidationResult {
	if a.pythonManager != nil {
		return a.pythonManager.VerifyPython(path)
	}
	return models.ValidationResult{Valid: false, Message: "Python manager not initialized"}
}

func (a *App) SelectPython(path string, createVenv bool) {
	a.ClosePythonSelectionWindow()
	go a.startBackendServices(createVenv, path)
}

func (a *App) DownloadPortableBackend(version string) error {
	backendPath := a.getBackendPath()
	downloader := services.NewBackendDownloader(func(progress models.DownloadProgress) {
		a.wailsApp.Event.Emit("download:progress", progress)
	})

	err := downloader.DownloadPortable(services.BackendDownloadOptions{
		Version:       version,
		IsPortable:    true,
		PythonVersion: "3.12",
		DestPath:      backendPath,
	})

	if err != nil {
		a.wailsApp.Event.Emit("download:complete", models.DownloadComplete{
			Success: false,
			Message: err.Error(),
		})
		return err
	}

	config := a.pythonManager.LoadConfig()
	config.DistributionType = models.DistributionPortable
	config.BackendSource = models.BackendSourceRelease
	a.pythonManager.SaveConfig(config)

	a.wailsApp.Event.Emit("download:complete", models.DownloadComplete{
		Success: true,
		Message: "Portable backend downloaded successfully",
	})

	portablePython := a.getPortablePythonPath(backendPath)
	go a.startBackendServices(false, portablePython)

	return nil
}

func (a *App) SetupNativeBackend(pythonPath string, branch string) error {
	backendPath := a.getBackendPath()
	downloader := services.NewBackendDownloader(func(progress models.DownloadProgress) {
		a.wailsApp.Event.Emit("download:progress", progress)
	})

	a.sendBackendLog("Cloning backend repository...", "info")

	err := downloader.DownloadSource(backendPath, branch)
	if err != nil {
		a.wailsApp.Event.Emit("download:complete", models.DownloadComplete{
			Success: false,
			Message: err.Error(),
		})
		return err
	}

	a.sendBackendLog("Creating virtual environment...", "info")
	venvPython, err := a.pythonManager.CreateVirtualEnvironment(pythonPath)
	if err != nil {
		a.wailsApp.Event.Emit("download:complete", models.DownloadComplete{
			Success: false,
			Message: fmt.Sprintf("Failed to create venv: %v", err),
		})
		return err
	}

	config := a.pythonManager.LoadConfig()
	config.PythonPath = pythonPath
	config.VenvPath = venvPython
	config.DistributionType = models.DistributionNative
	config.BackendSource = models.BackendSourceGit
	a.pythonManager.SaveConfig(config)

	a.wailsApp.Event.Emit("download:complete", models.DownloadComplete{
		Success: true,
		Message: "Native backend setup complete",
	})

	go a.startBackendServices(false, venvPython)

	return nil
}

func (a *App) GetDistributionInfo() map[string]interface{} {
	config := a.pythonManager.LoadConfig()
	backendPath := a.getBackendPath()
	downloader := services.NewBackendDownloader(nil)

	return map[string]interface{}{
		"distributionType": string(config.DistributionType),
		"backendSource":    string(config.BackendSource),
		"pythonPath":       config.PythonPath,
		"venvPath":         config.VenvPath,
		"isPortable":       downloader.IsPortableBackend(backendPath),
		"backendExists":    downloader.BackendExists(backendPath),
	}
}

func (a *App) DownloadValkey() error {
	if !a.WaitForInitialization(30 * time.Second) {
		return fmt.Errorf("timeout waiting for initialization")
	}

	if a.redisManager == nil {
		return fmt.Errorf("redis manager not initialized")
	}

	redisDir := a.redisManager.GetRedisDir()

	progressHandler := func(progress models.DownloadProgress) {
		a.wailsApp.Event.Emit("download:progress", progress)
	}

	downloader := services.NewValkeyDownloader(progressHandler)

	err := downloader.DownloadValkey(redisDir)
	if err != nil {
		if os.Getenv("CUPCAKE_TEST_MODE") != "true" {
			a.wailsApp.Event.Emit("download:complete", models.DownloadComplete{
				Success: false,
				Message: err.Error(),
			})
		}
		return err
	}

	if os.Getenv("CUPCAKE_TEST_MODE") != "true" {
		a.wailsApp.Event.Emit("download:complete", models.DownloadComplete{
			Success: true,
			Message: "Valkey downloaded successfully",
		})

		go func() {
			if err := a.backendManager.StartRedisServer(); err != nil {
				a.sendBackendStatus("redis", "error", fmt.Sprintf("Redis error: %v", err))
				return
			}
			a.sendBackendStatus("redis", "ready", "Redis server started")

			backendDir := a.getBackendPath()
			if err := a.backendManager.StartDjangoServer(backendDir, a.venvPath); err != nil {
				a.sendBackendStatus("django", "error", fmt.Sprintf("Django error: %v", err))
				return
			}
			a.sendBackendStatus("django", "ready", fmt.Sprintf("Server running on port %d", a.backendManager.GetBackendPort()))

			if err := a.backendManager.StartRQWorker(backendDir, a.venvPath); err != nil {
				a.sendBackendStatus("rq", "error", fmt.Sprintf("RQ worker error: %v", err))
				return
			}
			a.sendBackendStatus("rq", "ready", "RQ worker started")

			a.sendBackendLog("All services started successfully!", "success")
			a.backendReady = true
			a.transitionToMainWindow()
		}()
	}

	return nil
}

func (a *App) CreateSuperuser(username, email, password string) error {
	if a.userManager == nil {
		return fmt.Errorf("user manager not initialized")
	}
	backendDir := a.getBackendPath()
	return a.userManager.CreateSuperuser(backendDir, a.venvPath, username, email, password)
}

func (a *App) RunSyncSchemas() error {
	if a.backendManager == nil {
		return fmt.Errorf("backend manager not initialized")
	}
	backendDir := a.getBackendPath()
	return a.backendManager.RunManagementCommand(backendDir, a.venvPath, "sync_schemas", nil, func(output string, isError bool) {
		msgType := "info"
		if isError {
			msgType = "error"
		}
		a.wailsApp.Event.Emit("command:output", map[string]interface{}{
			"command": "sync-schemas",
			"output":  output,
			"type":    msgType,
		})
	})
}

func (a *App) RunLoadColumnTemplates() error {
	if a.backendManager == nil {
		return fmt.Errorf("backend manager not initialized")
	}
	backendDir := a.getBackendPath()
	return a.backendManager.RunManagementCommand(backendDir, a.venvPath, "load_column_templates", nil, func(output string, isError bool) {
		msgType := "info"
		if isError {
			msgType = "error"
		}
		a.wailsApp.Event.Emit("command:output", map[string]interface{}{
			"command": "load-column-templates",
			"output":  output,
			"type":    msgType,
		})
	})
}

func (a *App) RunLoadOntologies() error {
	if a.backendManager == nil {
		return fmt.Errorf("backend manager not initialized")
	}
	backendDir := a.getBackendPath()
	return a.backendManager.RunManagementCommand(backendDir, a.venvPath, "load_ontologies", []string{"--no-limit"}, func(output string, isError bool) {
		msgType := "info"
		if isError {
			msgType = "error"
		}
		a.wailsApp.Event.Emit("command:output", map[string]interface{}{
			"command": "load-ontologies",
			"output":  output,
			"type":    msgType,
		})
	})
}

func (a *App) GetAvailableReleases() ([]models.ReleaseInfo, error) {
	downloader := services.NewBackendDownloader(nil)
	return downloader.GetAvailableReleases()
}

func (a *App) OpenFile(title string) (string, error) {
	return a.wailsApp.Dialog.OpenFile().
		SetTitle(title).
		PromptForSingleSelection()
}

func (a *App) OpenDirectory(title string) (string, error) {
	return a.wailsApp.Dialog.OpenFile().
		SetTitle(title).
		CanChooseDirectories(true).
		CanChooseFiles(false).
		PromptForSingleSelection()
}

func (a *App) LogToFile(message string) error {
	log.Printf("[Frontend] %s", message)
	return nil
}

func (a *App) GetLogFilePath() string {
	return a.logFilePath
}

func (a *App) GetSchemaCount() (int, error) {
	if a.backendManager == nil {
		return 0, fmt.Errorf("backend manager not initialized")
	}
	backendDir := a.getBackendPath()
	return a.backendManager.GetSchemaCount(backendDir, a.venvPath)
}

func (a *App) GetColumnTemplateCount() (int, error) {
	if a.backendManager == nil {
		return 0, fmt.Errorf("backend manager not initialized")
	}
	backendDir := a.getBackendPath()
	return a.backendManager.GetColumnTemplateCount(backendDir, a.venvPath)
}

func (a *App) GetOntologyCounts() (map[string]int, error) {
	if a.backendManager == nil {
		return nil, fmt.Errorf("backend manager not initialized")
	}
	backendDir := a.getBackendPath()
	return a.backendManager.GetOntologyCounts(backendDir, a.venvPath)
}

func (a *App) OpenManagementPanel() {
	log.Println("[App] Opening management panel window...")

	if a.managementWindow != nil {
		a.managementWindow.Focus()
		return
	}

	a.managementWindow = a.wailsApp.Window.New()
	a.managementWindow.SetTitle("Database Setup")
	a.managementWindow.SetSize(700, 600)
	a.managementWindow.SetMinSize(600, 500)
	a.managementWindow.SetURL("/setup/#/management")

	a.managementWindow.OnWindowEvent(events.Common.WindowClosing, func(e *application.WindowEvent) {
		a.managementWindow = nil
	})

	a.managementWindow.Show()
}

func (a *App) OpenDebugPanel() {
	log.Println("[App] Opening debug panel window...")

	if a.debugWindow != nil {
		a.debugWindow.Focus()
		return
	}

	a.debugWindow = a.wailsApp.Window.New()
	a.debugWindow.SetTitle("Debug Panel")
	a.debugWindow.SetSize(800, 600)
	a.debugWindow.SetMinSize(600, 400)
	a.debugWindow.SetURL("/setup/#/debug")

	a.debugWindow.OnWindowEvent(events.Common.WindowClosing, func(e *application.WindowEvent) {
		a.debugWindow = nil
	})

	a.debugWindow.Show()
}

func (a *App) ClosePythonSelectionWindow() {
	if a.pythonSelectionWindow != nil {
		a.pythonSelectionWindow.Close()
		a.pythonSelectionWindow = nil
	}
}

func (a *App) CloseDownloaderWindow() {
	if a.downloaderWindow != nil {
		a.downloaderWindow.Close()
		a.downloaderWindow = nil
	}
}

func (a *App) CloseSuperuserWindow() {
	if a.superuserWindow != nil {
		a.superuserWindow.Close()
		a.superuserWindow = nil
	}
}

func (a *App) CloseManagementWindow() {
	if a.managementWindow != nil {
		a.managementWindow.Close()
		a.managementWindow = nil
	}
}

func (a *App) CloseDebugWindow() {
	if a.debugWindow != nil {
		a.debugWindow.Close()
		a.debugWindow = nil
	}
}

func (a *App) GetDownloadProgress() models.DownloadProgress {
	if a.downloader == nil {
		return models.DownloadProgress{}
	}
	return a.downloader.GetCurrentProgress()
}

func (a *App) IsDownloading() bool {
	if a.downloader == nil {
		return false
	}
	return a.downloader.IsDownloading()
}
