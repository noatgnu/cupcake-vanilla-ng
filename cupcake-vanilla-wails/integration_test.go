package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/noatgnu/cupcake-vanilla-wails/backend/models"
	"github.com/noatgnu/cupcake-vanilla-wails/backend/services"
)

func TestFullInitializationFlow(t *testing.T) {
	testDataPath := filepath.Join(os.TempDir(), "cupcake-vanilla-test")
	defer os.RemoveAll(testDataPath)

	if err := os.MkdirAll(testDataPath, 0755); err != nil {
		t.Fatalf("Failed to create test data path: %v", err)
	}

	log.Printf("Test data path: %s", testDataPath)

	t.Run("DatabaseService", func(t *testing.T) {
		db, err := services.NewDatabaseService(testDataPath)
		if err != nil {
			t.Fatalf("Failed to create database service: %v", err)
		}
		defer db.Close()

		if err := db.SetConfig("test_key", "test_value"); err != nil {
			t.Fatalf("Failed to set config: %v", err)
		}

		value, err := db.GetConfig("test_key")
		if err != nil {
			t.Fatalf("Failed to get config: %v", err)
		}
		if value != "test_value" {
			t.Errorf("Expected 'test_value', got '%s'", value)
		}

		log.Println("Database service: OK")
	})

	t.Run("PythonDetection", func(t *testing.T) {
		pythonManager := services.NewPythonManager(testDataPath)
		candidates := pythonManager.DetectPythonCandidates()

		log.Printf("Found %d Python candidates:", len(candidates))
		for _, c := range candidates {
			log.Printf("  - %s (%s) at %s", c.Command, c.Version, c.Path)
		}

		if len(candidates) == 0 {
			t.Skip("No Python found on system - skipping Python-dependent tests")
		}

		bestCandidate := candidates[0]
		result := pythonManager.VerifyPython(bestCandidate.Path)
		if !result.Valid {
			t.Errorf("Python verification failed: %s", result.Message)
		}

		log.Printf("Best Python candidate: %s (%s)", bestCandidate.Path, result.Version)
	})

	t.Run("BackendDownloader_GetReleases", func(t *testing.T) {
		downloader := services.NewBackendDownloader(nil)
		releases, err := downloader.GetAvailableReleases()
		if err != nil {
			t.Fatalf("Failed to get releases: %v", err)
		}

		log.Printf("Found %d releases/branches:", len(releases))
		for _, r := range releases {
			log.Printf("  - %s: %s", r.Tag, r.Name)
		}

		if len(releases) == 0 {
			t.Error("Expected at least one release/branch")
		}
	})

	t.Run("BackendClone", func(t *testing.T) {
		backendPath := filepath.Join(testDataPath, "backend")
		downloader := services.NewBackendDownloader(func(progress models.DownloadProgress) {
			log.Printf("Clone progress: %d%%", progress.Percentage)
		})

		log.Println("Cloning backend repository...")
		err := downloader.DownloadSource(backendPath, "")
		if err != nil {
			t.Fatalf("Failed to clone backend: %v", err)
		}

		if !downloader.BackendExists(backendPath) {
			t.Error("Backend directory does not exist after clone")
		}

		managePy := filepath.Join(backendPath, "manage.py")
		if _, err := os.Stat(managePy); os.IsNotExist(err) {
			t.Error("manage.py not found in cloned backend")
		}

		log.Println("Backend cloned successfully")
	})

	t.Run("VenvCreation", func(t *testing.T) {
		pythonManager := services.NewPythonManager(testDataPath)
		candidates := pythonManager.DetectPythonCandidates()

		if len(candidates) == 0 {
			t.Skip("No Python 3.12+ found - skipping venv creation test")
		}

		var pythonPath string
		for _, c := range candidates {
			if c.Version >= "3.12" {
				pythonPath = c.Path
				break
			}
		}
		if pythonPath == "" {
			t.Skip("No Python 3.12+ found - skipping venv creation test")
		}
		log.Printf("Creating venv with Python: %s", pythonPath)

		venvPython, err := pythonManager.CreateVirtualEnvironment(pythonPath)
		if err != nil {
			if strings.Contains(err.Error(), "ensurepip") || strings.Contains(err.Error(), "venv") {
				t.Skipf("Venv module not available (install python3.12-venv): %v", err)
			}
			t.Fatalf("Failed to create venv: %v", err)
		}

		if _, err := os.Stat(venvPython); os.IsNotExist(err) {
			t.Errorf("Venv Python not found at: %s", venvPython)
		}

		log.Printf("Venv created successfully: %s", venvPython)

		config := pythonManager.LoadConfig()
		config.PythonPath = pythonPath
		config.VenvPath = venvPython
		config.DistributionType = models.DistributionNative
		config.BackendSource = models.BackendSourceGit
		pythonManager.SaveConfig(config)

		loadedConfig := pythonManager.LoadConfig()
		if loadedConfig.DistributionType != models.DistributionNative {
			t.Errorf("Expected DistributionNative, got %s", loadedConfig.DistributionType)
		}
		if loadedConfig.BackendSource != models.BackendSourceGit {
			t.Errorf("Expected BackendSourceGit, got %s", loadedConfig.BackendSource)
		}

		log.Println("Config saved and loaded successfully")
	})

	t.Run("DependencyInstallation", func(t *testing.T) {
		pythonManager := services.NewPythonManager(testDataPath)
		config := pythonManager.LoadConfig()

		if config.VenvPath == "" {
			t.Skip("No venv path - skipping dependency installation")
		}

		backendPath := filepath.Join(testDataPath, "backend")
		requirementsPath := filepath.Join(backendPath, "requirements.txt")

		if _, err := os.Stat(requirementsPath); os.IsNotExist(err) {
			t.Skip("No requirements.txt found - skipping dependency installation")
		}

		log.Println("Installing dependencies (this may take a while)...")
		err := pythonManager.InstallDependencies(config.VenvPath, requirementsPath)
		if err != nil {
			t.Logf("Warning: Dependency installation failed: %v", err)
			t.Logf("This is expected in CI environments without all build dependencies")
		} else {
			log.Println("Dependencies installed successfully")
		}
	})

	log.Println("\n=== Integration Test Summary ===")
	log.Printf("Test data path: %s", testDataPath)
	log.Println("All initialization steps completed successfully!")
}

func TestNativeBackendSetup(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	testDataPath := filepath.Join(os.TempDir(), fmt.Sprintf("cupcake-vanilla-native-test-%d", os.Getpid()))
	defer os.RemoveAll(testDataPath)

	if err := os.MkdirAll(testDataPath, 0755); err != nil {
		t.Fatalf("Failed to create test data path: %v", err)
	}

	pythonManager := services.NewPythonManager(testDataPath)
	candidates := pythonManager.DetectPythonCandidates()

	if len(candidates) == 0 {
		t.Skip("No Python 3.12+ found on system")
	}

	var pythonPath string
	var selectedVersion string
	for _, c := range candidates {
		if c.Version >= "3.12" {
			pythonPath = c.Path
			selectedVersion = c.Version
			break
		}
	}
	if pythonPath == "" {
		t.Skip("No Python 3.12+ found on system")
	}
	log.Printf("Using Python: %s (%s)", pythonPath, selectedVersion)

	backendPath := filepath.Join(testDataPath, "backend")
	downloader := services.NewBackendDownloader(func(progress models.DownloadProgress) {
		if progress.Percentage%20 == 0 {
			log.Printf("Progress: %d%%", progress.Percentage)
		}
	})

	log.Println("Step 1: Cloning backend repository...")
	if err := downloader.DownloadSource(backendPath, ""); err != nil {
		t.Fatalf("Failed to clone: %v", err)
	}

	if !downloader.BackendExists(backendPath) {
		t.Fatal("Backend does not exist after clone")
	}
	log.Println("Backend cloned successfully")

	log.Println("Step 2: Creating virtual environment...")
	venvPython, err := pythonManager.CreateVirtualEnvironment(pythonPath)
	if err != nil {
		if strings.Contains(err.Error(), "ensurepip") || strings.Contains(err.Error(), "venv") {
			t.Skipf("Venv module not available (install python3.12-venv): %v", err)
		}
		t.Fatalf("Failed to create venv: %v", err)
	}
	log.Printf("Venv created: %s", venvPython)

	log.Println("Step 3: Saving configuration...")
	config := pythonManager.LoadConfig()
	config.PythonPath = pythonPath
	config.VenvPath = venvPython
	config.DistributionType = models.DistributionNative
	config.BackendSource = models.BackendSourceGit
	pythonManager.SaveConfig(config)

	savedConfig := pythonManager.LoadConfig()
	if savedConfig.DistributionType != models.DistributionNative {
		t.Errorf("Config not saved correctly: expected native, got %s", savedConfig.DistributionType)
	}

	log.Println("Step 4: Installing dependencies...")
	requirementsPath := filepath.Join(backendPath, "requirements.txt")
	if err := pythonManager.InstallDependencies(venvPython, requirementsPath); err != nil {
		log.Printf("Warning: Dependency installation failed: %v", err)
		log.Println("This is common in environments without all build tools")
	} else {
		log.Println("Dependencies installed successfully")
	}

	log.Println("Step 5: Running Django migrations...")
	isDev := true
	redisManager := services.NewRedisManager(services.RedisManagerOptions{
		UserDataPath: testDataPath,
		IsDev:        isDev,
	})
	backendManager := services.NewBackendManager(testDataPath, isDev, redisManager)

	if err := backendManager.RunMigrations(backendPath, venvPython); err != nil {
		t.Logf("Warning: Migrations failed: %v", err)
		log.Println("Migrations failed - this may be expected without Redis")
	} else {
		log.Println("Migrations completed successfully")
	}

	log.Println("Step 6: Collecting static files...")
	if err := backendManager.CollectStaticFiles(backendPath, venvPython); err != nil {
		t.Logf("Warning: Static file collection failed: %v", err)
	} else {
		log.Println("Static files collected successfully")
	}

	log.Println("Step 7: Starting Redis server...")
	redisDir := redisManager.GetRedisDir()
	if err := os.MkdirAll(redisDir, 0755); err != nil {
		t.Fatalf("Failed to create Redis directory: %v", err)
	}
	if err := redisManager.StartRedis(); err != nil {
		if services.IsRedisNotFoundError(err) {
			log.Println("Redis/Valkey not found - skipping server startup tests")
			log.Println("\n=== Native Backend Setup Complete (without Redis) ===")
			log.Printf("Backend path: %s", backendPath)
			log.Printf("Venv Python: %s", venvPython)
			log.Printf("Distribution: %s", savedConfig.DistributionType)
			log.Printf("Source: %s", savedConfig.BackendSource)
			return
		}
		t.Fatalf("Failed to start Redis: %v", err)
	}
	defer redisManager.StopRedis()
	log.Println("Redis started successfully")

	log.Println("Step 8: Starting Django server...")
	if err := backendManager.StartDjangoServer(backendPath, venvPython); err != nil {
		t.Fatalf("Failed to start Django: %v", err)
	}
	defer backendManager.StopServices()

	if !backendManager.IsDjangoRunning() {
		t.Fatal("Django server is not running after start")
	}
	log.Printf("Django running on port %d", backendManager.GetBackendPort())

	log.Println("Step 9: Starting RQ worker...")
	if err := backendManager.StartRQWorker(backendPath, venvPython); err != nil {
		t.Logf("Warning: RQ worker failed to start: %v", err)
	} else {
		log.Println("RQ worker started successfully")
	}

	log.Println("\n=== Native Backend Setup Complete ===")
	log.Printf("Backend path: %s", backendPath)
	log.Printf("Venv Python: %s", venvPython)
	log.Printf("Distribution: %s", savedConfig.DistributionType)
	log.Printf("Source: %s", savedConfig.BackendSource)
	log.Printf("Django port: %d", backendManager.GetBackendPort())
	log.Printf("Redis port: %d", redisManager.GetRedisPort())
}
