package services

import (
	"fmt"
	"log"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
)

type UserManager struct {
	backendManager *BackendManager
	userDataPath   string
	isDev          bool
}

func NewUserManager(backendManager *BackendManager, userDataPath string, isDev bool) *UserManager {
	return &UserManager{
		backendManager: backendManager,
		userDataPath:   userDataPath,
		isDev:          isDev,
	}
}

func (u *UserManager) GetUserCount(backendDir, pythonPath string) (int, error) {
	log.Printf("[UserManager] GetUserCount: backendDir=%s, pythonPath=%s", backendDir, pythonPath)

	managePy := filepath.Join(backendDir, "manage.py")
	script := "from django.contrib.auth import get_user_model; User = get_user_model(); print(User.objects.count())"

	cmd := exec.Command(pythonPath, managePy, "shell", "-c", script)
	cmd.Dir = backendDir
	cmd.Env = u.getBackendEnv(backendDir)

	output, err := cmd.CombinedOutput()
	log.Printf("[UserManager] GetUserCount output: %s", string(output))
	if err != nil {
		log.Printf("[UserManager] Error getting user count: %v, output: %s", err, string(output))
		return 0, err
	}

	countStr := strings.TrimSpace(string(output))
	log.Printf("[UserManager] Parsing count from: '%s'", countStr)

	lines := strings.Split(countStr, "\n")
	lastLine := strings.TrimSpace(lines[len(lines)-1])
	log.Printf("[UserManager] Last line: '%s'", lastLine)

	count, err := strconv.Atoi(lastLine)
	if err != nil {
		log.Printf("[UserManager] Failed to parse count from: '%s'", lastLine)
		return 0, fmt.Errorf("failed to parse user count: %s", countStr)
	}

	log.Printf("[UserManager] User count: %d", count)
	return count, nil
}

func (u *UserManager) CreateSuperuser(backendDir, pythonPath, username, email, password string) error {
	log.Printf("[UserManager] Creating superuser: %s", username)
	log.Printf("[UserManager] Backend dir: %s", backendDir)
	log.Printf("[UserManager] Python path: %s", pythonPath)

	managePy := filepath.Join(backendDir, "manage.py")
	log.Printf("[UserManager] manage.py path: %s", managePy)

	script := fmt.Sprintf(`
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='%s').exists():
    User.objects.create_superuser('%s', '%s', '%s')
    print('SUCCESS')
else:
    print('EXISTS')
`, username, username, email, password)

	cmd := exec.Command(pythonPath, managePy, "shell", "-c", script)
	cmd.Dir = backendDir
	cmd.Env = u.getBackendEnv(backendDir)

	log.Printf("[UserManager] Executing command: %s %s shell -c ...", pythonPath, managePy)

	output, err := cmd.CombinedOutput()
	log.Printf("[UserManager] Command output: %s", string(output))
	if err != nil {
		log.Printf("[UserManager] Error creating superuser: %v, output: %s", err, string(output))
		return fmt.Errorf("failed to create superuser: %w", err)
	}

	result := strings.TrimSpace(string(output))
	if strings.Contains(result, "SUCCESS") {
		log.Printf("[UserManager] Superuser %s created successfully", username)
		return nil
	}
	if strings.Contains(result, "EXISTS") {
		log.Printf("[UserManager] Superuser %s already exists", username)
		return nil
	}

	log.Printf("[UserManager] Unexpected output: %s", result)
	return nil
}

func (u *UserManager) CheckUserExists(backendDir, pythonPath, username string) (bool, error) {
	managePy := filepath.Join(backendDir, "manage.py")
	script := fmt.Sprintf(`
from django.contrib.auth import get_user_model
User = get_user_model()
print('EXISTS' if User.objects.filter(username='%s').exists() else 'NOT_EXISTS')
`, username)

	cmd := exec.Command(pythonPath, managePy, "shell", "-c", script)
	cmd.Dir = backendDir
	cmd.Env = u.getBackendEnv(backendDir)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return false, err
	}

	return strings.Contains(strings.TrimSpace(string(output)), "EXISTS"), nil
}

func (u *UserManager) ChangePassword(backendDir, pythonPath, username, newPassword string) error {
	managePy := filepath.Join(backendDir, "manage.py")
	script := fmt.Sprintf(`
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.get(username='%s')
user.set_password('%s')
user.save()
print('SUCCESS')
`, username, newPassword)

	cmd := exec.Command(pythonPath, managePy, "shell", "-c", script)
	cmd.Dir = backendDir
	cmd.Env = u.getBackendEnv(backendDir)

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("[UserManager] Error changing password: %v, output: %s", err, string(output))
		return fmt.Errorf("failed to change password: %w", err)
	}

	return nil
}

func (u *UserManager) ListUsers(backendDir, pythonPath string) ([]string, error) {
	managePy := filepath.Join(backendDir, "manage.py")
	script := `
from django.contrib.auth import get_user_model
User = get_user_model()
for user in User.objects.all():
    print(user.username)
`

	cmd := exec.Command(pythonPath, managePy, "shell", "-c", script)
	cmd.Dir = backendDir
	cmd.Env = u.getBackendEnv(backendDir)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, err
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	var users []string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" {
			users = append(users, line)
		}
	}

	return users, nil
}

func (u *UserManager) getBackendEnv(backendDir string) []string {
	if u.backendManager != nil {
		return u.backendManager.getBackendEnv(backendDir)
	}
	return nil
}
