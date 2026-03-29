package services

import (
	"os"
	"path/filepath"
	"testing"
)

func TestNewBackupManager(t *testing.T) {
	testDataPath := filepath.Join(os.TempDir(), "cupcake-backup-test")
	defer os.RemoveAll(testDataPath)

	if err := os.MkdirAll(testDataPath, 0755); err != nil {
		t.Fatalf("Failed to create test data path: %v", err)
	}

	redisManager := NewRedisManager(RedisManagerOptions{
		UserDataPath: testDataPath,
		IsDev:        true,
	})
	backendManager := NewBackendManager(testDataPath, true, redisManager)
	backupManager := NewBackupManager(testDataPath, backendManager)

	if backupManager == nil {
		t.Fatal("NewBackupManager returned nil")
	}

	if backupManager.backupDir == "" {
		t.Error("Backup directory should not be empty")
	}

	expectedBackupDir := filepath.Join(testDataPath, "backend", "backups")
	if backupManager.backupDir != expectedBackupDir {
		t.Errorf("Expected backup dir %s, got %s", expectedBackupDir, backupManager.backupDir)
	}

	if _, err := os.Stat(backupManager.backupDir); os.IsNotExist(err) {
		t.Error("Backup directory should be created")
	}
}

func TestBackupManagerLogCallback(t *testing.T) {
	testDataPath := filepath.Join(os.TempDir(), "cupcake-backup-test-log")
	defer os.RemoveAll(testDataPath)

	if err := os.MkdirAll(testDataPath, 0755); err != nil {
		t.Fatalf("Failed to create test data path: %v", err)
	}

	redisManager := NewRedisManager(RedisManagerOptions{
		UserDataPath: testDataPath,
		IsDev:        true,
	})
	backendManager := NewBackendManager(testDataPath, true, redisManager)
	backupManager := NewBackupManager(testDataPath, backendManager)

	logReceived := false
	var receivedMessage string
	var receivedType string

	backupManager.SetLogCallback(func(message string, msgType string) {
		logReceived = true
		receivedMessage = message
		receivedType = msgType
	})

	backupManager.log("Test message", "info")

	if !logReceived {
		t.Error("Log callback was not called")
	}
	if receivedMessage != "Test message" {
		t.Errorf("Expected message 'Test message', got '%s'", receivedMessage)
	}
	if receivedType != "info" {
		t.Errorf("Expected type 'info', got '%s'", receivedType)
	}
}

func TestGetBackupDir(t *testing.T) {
	testDataPath := filepath.Join(os.TempDir(), "cupcake-backup-test-dir")
	defer os.RemoveAll(testDataPath)

	if err := os.MkdirAll(testDataPath, 0755); err != nil {
		t.Fatalf("Failed to create test data path: %v", err)
	}

	redisManager := NewRedisManager(RedisManagerOptions{
		UserDataPath: testDataPath,
		IsDev:        true,
	})
	backendManager := NewBackendManager(testDataPath, true, redisManager)
	backupManager := NewBackupManager(testDataPath, backendManager)

	backupDir := backupManager.GetBackupDir()

	expectedDir := filepath.Join(testDataPath, "backend", "backups")
	if backupDir != expectedDir {
		t.Errorf("Expected backup dir %s, got %s", expectedDir, backupDir)
	}
}

func TestListBackupsEmptyDirectory(t *testing.T) {
	testDataPath := filepath.Join(os.TempDir(), "cupcake-backup-test-list")
	defer os.RemoveAll(testDataPath)

	if err := os.MkdirAll(testDataPath, 0755); err != nil {
		t.Fatalf("Failed to create test data path: %v", err)
	}

	redisManager := NewRedisManager(RedisManagerOptions{
		UserDataPath: testDataPath,
		IsDev:        true,
	})
	backendManager := NewBackendManager(testDataPath, true, redisManager)
	backupManager := NewBackupManager(testDataPath, backendManager)

	backups, err := backupManager.ListBackups()
	if err != nil {
		t.Fatalf("ListBackups failed: %v", err)
	}

	if len(backups) != 0 {
		t.Errorf("Expected 0 backups, got %d", len(backups))
	}
}

func TestListBackupsWithFiles(t *testing.T) {
	testDataPath := filepath.Join(os.TempDir(), "cupcake-backup-test-files")
	defer os.RemoveAll(testDataPath)

	if err := os.MkdirAll(testDataPath, 0755); err != nil {
		t.Fatalf("Failed to create test data path: %v", err)
	}

	redisManager := NewRedisManager(RedisManagerOptions{
		UserDataPath: testDataPath,
		IsDev:        true,
	})
	backendManager := NewBackendManager(testDataPath, true, redisManager)
	backupManager := NewBackupManager(testDataPath, backendManager)

	dbBackupFile := filepath.Join(backupManager.backupDir, "default-2024-01-01-120000.sqlite3")
	if err := os.WriteFile(dbBackupFile, []byte("test db backup"), 0644); err != nil {
		t.Fatalf("Failed to create test db backup file: %v", err)
	}

	mediaBackupFile := filepath.Join(backupManager.backupDir, "media-2024-01-01-120000.tar")
	if err := os.WriteFile(mediaBackupFile, []byte("test media backup"), 0644); err != nil {
		t.Fatalf("Failed to create test media backup file: %v", err)
	}

	nonBackupFile := filepath.Join(backupManager.backupDir, "random.txt")
	if err := os.WriteFile(nonBackupFile, []byte("not a backup"), 0644); err != nil {
		t.Fatalf("Failed to create test non-backup file: %v", err)
	}

	backups, err := backupManager.ListBackups()
	if err != nil {
		t.Fatalf("ListBackups failed: %v", err)
	}

	if len(backups) != 3 {
		t.Errorf("Expected 3 backup files, got %d", len(backups))
	}

	dbFound := false
	mediaFound := false
	for _, b := range backups {
		if b.Name == "default-2024-01-01-120000.sqlite3" {
			dbFound = true
			if b.Type != "database" {
				t.Errorf("Expected database type for db backup, got %s", b.Type)
			}
		}
		if b.Name == "media-2024-01-01-120000.tar" {
			mediaFound = true
			if b.Type != "media" {
				t.Errorf("Expected media type for media backup, got %s", b.Type)
			}
		}
	}

	if !dbFound {
		t.Error("Database backup not found in list")
	}
	if !mediaFound {
		t.Error("Media backup not found in list")
	}
}

func TestDeleteBackup(t *testing.T) {
	testDataPath := filepath.Join(os.TempDir(), "cupcake-backup-test-delete")
	defer os.RemoveAll(testDataPath)

	if err := os.MkdirAll(testDataPath, 0755); err != nil {
		t.Fatalf("Failed to create test data path: %v", err)
	}

	redisManager := NewRedisManager(RedisManagerOptions{
		UserDataPath: testDataPath,
		IsDev:        true,
	})
	backendManager := NewBackendManager(testDataPath, true, redisManager)
	backupManager := NewBackupManager(testDataPath, backendManager)

	backupFile := filepath.Join(backupManager.backupDir, "test-backup.sqlite3.gz")
	if err := os.WriteFile(backupFile, []byte("test backup"), 0644); err != nil {
		t.Fatalf("Failed to create test backup file: %v", err)
	}

	if _, err := os.Stat(backupFile); os.IsNotExist(err) {
		t.Fatal("Backup file should exist before deletion")
	}

	err := backupManager.DeleteBackup(backupFile)
	if err != nil {
		t.Fatalf("DeleteBackup failed: %v", err)
	}

	if _, err := os.Stat(backupFile); !os.IsNotExist(err) {
		t.Error("Backup file should not exist after deletion")
	}
}

func TestDeleteBackupInvalidPath(t *testing.T) {
	testDataPath := filepath.Join(os.TempDir(), "cupcake-backup-test-invalid")
	defer os.RemoveAll(testDataPath)

	if err := os.MkdirAll(testDataPath, 0755); err != nil {
		t.Fatalf("Failed to create test data path: %v", err)
	}

	redisManager := NewRedisManager(RedisManagerOptions{
		UserDataPath: testDataPath,
		IsDev:        true,
	})
	backendManager := NewBackendManager(testDataPath, true, redisManager)
	backupManager := NewBackupManager(testDataPath, backendManager)

	err := backupManager.DeleteBackup("/etc/passwd")
	if err == nil {
		t.Error("DeleteBackup should fail for path outside backup directory")
	}
}

func TestDeleteBackupNonExistent(t *testing.T) {
	testDataPath := filepath.Join(os.TempDir(), "cupcake-backup-test-nonexist")
	defer os.RemoveAll(testDataPath)

	if err := os.MkdirAll(testDataPath, 0755); err != nil {
		t.Fatalf("Failed to create test data path: %v", err)
	}

	redisManager := NewRedisManager(RedisManagerOptions{
		UserDataPath: testDataPath,
		IsDev:        true,
	})
	backendManager := NewBackendManager(testDataPath, true, redisManager)
	backupManager := NewBackupManager(testDataPath, backendManager)

	nonExistentFile := filepath.Join(backupManager.backupDir, "non-existent.sqlite3.gz")
	err := backupManager.DeleteBackup(nonExistentFile)
	if err == nil {
		t.Error("DeleteBackup should fail for non-existent file")
	}
}
