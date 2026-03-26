package models

import (
	"time"

	"gorm.io/gorm"
)

type Config struct {
	gorm.Model
	Key   string `gorm:"uniqueIndex" json:"key"`
	Value string `json:"value"`
}

type PythonConfig struct {
	PythonPath       string           `json:"pythonPath"`
	PythonVersion    string           `json:"pythonVersion"`
	VenvPath         string           `json:"venvPath"`
	DistributionType DistributionType `json:"distributionType"`
	BackendSource    BackendSource    `json:"backendSource"`
}

type DistributionType string

const (
	DistributionNative   DistributionType = "native"
	DistributionPortable DistributionType = "portable"
)

type BackendSource string

const (
	BackendSourceRelease BackendSource = "release"
	BackendSourceGit     BackendSource = "git"
)

type PythonCandidate struct {
	Command string `json:"command"`
	Version string `json:"version"`
	Path    string `json:"path"`
}

type ValidationResult struct {
	Valid   bool   `json:"valid"`
	Message string `json:"message,omitempty"`
	Version string `json:"version,omitempty"`
}

type BackendStatus struct {
	Service string `json:"service"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

type LogMessage struct {
	Message string `json:"message"`
	Type    string `json:"type"`
}

type DownloadProgress struct {
	Downloaded int64   `json:"downloaded"`
	Total      int64   `json:"total"`
	Percentage int     `json:"percentage"`
	Speed      float64 `json:"speed"`
}

type DownloadStatus struct {
	Message string `json:"message"`
	Type    string `json:"type"`
}

type DownloadComplete struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

type ReleaseInfo struct {
	Tag         string `json:"tag"`
	Name        string `json:"name"`
	PublishedAt string `json:"publishedAt"`
	HasPortable bool   `json:"hasPortable"`
}

type ProcessTracking struct {
	PID       int       `json:"pid"`
	Type      string    `json:"type"`
	Timestamp time.Time `json:"timestamp"`
}

type CommandHistory struct {
	gorm.Model
	Command   string    `json:"command"`
	Success   bool      `json:"success"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}

type OntologyCounts struct {
	Mondo  int `json:"mondo"`
	Uberon int `json:"uberon"`
	NCBI   int `json:"ncbi"`
	ChEBI  int `json:"chebi"`
	PSIMS  int `json:"psims"`
	Cell   int `json:"cell"`
	Total  int `json:"total"`
}
