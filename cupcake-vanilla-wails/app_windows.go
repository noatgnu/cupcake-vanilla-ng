//go:build windows

package main

import (
	"os/exec"
	"syscall"
)

func hideConsoleWindow(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000,
	}
}

func setProcessGroup(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000 | syscall.CREATE_NEW_PROCESS_GROUP,
	}
}

func killProcessGroup(pid int) error {
	cmd := exec.Command("taskkill", "/F", "/T", "/PID", string(rune(pid)))
	return cmd.Run()
}
