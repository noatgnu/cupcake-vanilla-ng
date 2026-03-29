package services

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

type BackupManager struct {
	userDataPath   string
	backupDir      string
	backendManager *BackendManager
	logCallback    func(message string, msgType string)
}

type BackupInfo struct {
	Name      string `json:"name"`
	Path      string `json:"path"`
	Size      int64  `json:"size"`
	CreatedAt string `json:"createdAt"`
	Type      string `json:"type"`
}

type BackupOptions struct {
	IncludeDatabase bool `json:"includeDatabase"`
	IncludeMedia    bool `json:"includeMedia"`
}

type BackupResult struct {
	Success  bool   `json:"success"`
	Message  string `json:"message"`
	FilePath string `json:"filePath"`
	Size     int64  `json:"size"`
}

func NewBackupManager(userDataPath string, backendManager *BackendManager) *BackupManager {
	backupDir := filepath.Join(userDataPath, "backend", "backups")
	os.MkdirAll(backupDir, 0755)

	return &BackupManager{
		userDataPath:   userDataPath,
		backupDir:      backupDir,
		backendManager: backendManager,
	}
}

func (b *BackupManager) SetLogCallback(callback func(message string, msgType string)) {
	b.logCallback = callback
}

func (b *BackupManager) log(message, msgType string) {
	log.Printf("[BackupManager] [%s] %s", msgType, message)
	if b.logCallback != nil {
		b.logCallback(message, msgType)
	}
}

func (b *BackupManager) GetBackupDir() string {
	return b.backupDir
}

func (b *BackupManager) CreateDatabaseBackup(backendDir, pythonPath string, outputCallback func(string, bool)) error {
	b.log("Creating database backup using Django dbbackup...", "info")

	err := b.backendManager.RunManagementCommand(backendDir, pythonPath, "dbbackup", []string{"--clean"}, outputCallback)
	if err != nil {
		b.log(fmt.Sprintf("Database backup failed: %v", err), "error")
		return fmt.Errorf("database backup failed: %w", err)
	}

	b.log("Database backup completed successfully", "success")
	return nil
}

func (b *BackupManager) CreateMediaBackup(backendDir, pythonPath string, outputCallback func(string, bool)) error {
	b.log("Creating media backup using Django mediabackup...", "info")

	err := b.backendManager.RunManagementCommand(backendDir, pythonPath, "mediabackup", []string{"--clean"}, outputCallback)
	if err != nil {
		b.log(fmt.Sprintf("Media backup failed: %v", err), "error")
		return fmt.Errorf("media backup failed: %w", err)
	}

	b.log("Media backup completed successfully", "success")
	return nil
}

func (b *BackupManager) RestoreDatabase(backendDir, pythonPath string, outputCallback func(string, bool)) error {
	b.log("Restoring database from latest backup...", "info")

	err := b.backendManager.RunManagementCommand(backendDir, pythonPath, "dbrestore", []string{"--uncompress"}, outputCallback)
	if err != nil {
		b.log(fmt.Sprintf("Database restore failed: %v", err), "error")
		return fmt.Errorf("database restore failed: %w", err)
	}

	b.log("Database restored successfully", "success")
	return nil
}

func (b *BackupManager) RestoreMedia(backendDir, pythonPath string, outputCallback func(string, bool)) error {
	b.log("Restoring media from latest backup...", "info")

	err := b.backendManager.RunManagementCommand(backendDir, pythonPath, "mediarestore", []string{"--uncompress"}, outputCallback)
	if err != nil {
		b.log(fmt.Sprintf("Media restore failed: %v", err), "error")
		return fmt.Errorf("media restore failed: %w", err)
	}

	b.log("Media restored successfully", "success")
	return nil
}

func (b *BackupManager) ListBackups() ([]BackupInfo, error) {
	var backups []BackupInfo

	entries, err := os.ReadDir(b.backupDir)
	if err != nil {
		if os.IsNotExist(err) {
			return backups, nil
		}
		return nil, fmt.Errorf("failed to read backup directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		backupType := "unknown"
		name := entry.Name()

		if strings.Contains(name, "default-db") || strings.HasSuffix(name, ".psql") || strings.HasSuffix(name, ".psql.gz") || strings.HasSuffix(name, ".sqlite3") || strings.HasSuffix(name, ".sqlite3.gz") || strings.HasSuffix(name, ".dump") || strings.HasSuffix(name, ".dump.gz") {
			backupType = "database"
		} else if strings.Contains(name, "media") || strings.HasSuffix(name, ".tar") || strings.HasSuffix(name, ".tar.gz") {
			backupType = "media"
		}

		backups = append(backups, BackupInfo{
			Name:      name,
			Path:      filepath.Join(b.backupDir, name),
			Size:      info.Size(),
			CreatedAt: info.ModTime().Format(time.RFC3339),
			Type:      backupType,
		})
	}

	sort.Slice(backups, func(i, j int) bool {
		return backups[i].CreatedAt > backups[j].CreatedAt
	})

	return backups, nil
}

func (b *BackupManager) DeleteBackup(backupPath string) error {
	if !strings.HasPrefix(filepath.Clean(backupPath), filepath.Clean(b.backupDir)) {
		return fmt.Errorf("invalid backup path")
	}

	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		return fmt.Errorf("backup file not found")
	}

	if err := os.Remove(backupPath); err != nil {
		return fmt.Errorf("failed to delete backup: %w", err)
	}

	b.log(fmt.Sprintf("Deleted backup: %s", filepath.Base(backupPath)), "success")
	return nil
}
