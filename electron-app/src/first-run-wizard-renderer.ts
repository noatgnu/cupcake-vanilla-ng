declare const wizardAPI: any;

class WizardRenderer {
  private currentStep: number = 1;
  private totalSteps: number = 7;
  private installationType: 'portable' | 'source' = 'portable';
  private logLines: string[] = [];

  constructor() {
    this.init();
  }

  private init(): void {
    this.setupNavigationButtons();
    this.setupInstallationTypeSelection();
    this.setupLogToggle();
    this.setupListeners();
    this.updateUI();
  }

  private setupNavigationButtons(): void {
    const backBtn = document.getElementById('backBtn') as HTMLButtonElement;
    const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement;
    const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;

    backBtn.addEventListener('click', () => this.previousStep());
    nextBtn.addEventListener('click', () => this.nextStep());
    cancelBtn.addEventListener('click', () => wizardAPI.cancel());
  }

  private setupInstallationTypeSelection(): void {
    const radioButtons = document.querySelectorAll('input[name="installationType"]');
    radioButtons.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.installationType = target.value as 'portable' | 'source';
        wizardAPI.setInstallationType(this.installationType);
      });
    });
  }

  private setupLogToggle(): void {
    const logToggle = document.getElementById('logToggle');
    const logOutput = document.getElementById('logOutput');

    if (logToggle && logOutput) {
      logToggle.addEventListener('click', () => {
        logOutput.classList.toggle('hidden');
        logToggle.textContent = logOutput.classList.contains('hidden')
          ? 'Show Detailed Logs'
          : 'Hide Detailed Logs';
      });
    }
  }

  private setupListeners(): void {
    wizardAPI.onStepChanged((step: number) => {
      this.currentStep = step;
      this.updateUI();
    });

    wizardAPI.onDownloadProgress((data: any) => {
      this.updateDownloadProgress(data);
    });

    wizardAPI.onInstallationProgress((data: any) => {
      this.updateInstallationProgress(data);
    });

    wizardAPI.onLog((message: string, type: string) => {
      this.addLogLine(message, type);
    });

    wizardAPI.onError((error: string) => {
      this.showError(error);
    });
  }

  private updateUI(): void {
    // Update step visibility
    for (let i = 1; i <= this.totalSteps; i++) {
      const stepEl = document.getElementById(`step${i}`);
      if (stepEl) {
        stepEl.classList.toggle('active', i === this.currentStep);
      }
    }

    // Update progress indicator
    this.updateProgressIndicator();

    // Update button states
    this.updateButtons();
  }

  private updateProgressIndicator(): void {
    const progressFill = document.getElementById('progressFill');
    const steps = document.querySelectorAll('.step');

    if (progressFill) {
      const progressPercent = (this.currentStep / this.totalSteps) * 100;
      progressFill.style.width = `${progressPercent}%`;
    }

    steps.forEach((step, index) => {
      const stepNum = index + 1;
      step.classList.remove('active', 'completed');

      if (stepNum === this.currentStep) {
        step.classList.add('active');
      } else if (stepNum < this.currentStep) {
        step.classList.add('completed');
      }
    });
  }

  private updateButtons(): void {
    const backBtn = document.getElementById('backBtn') as HTMLButtonElement;
    const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement;
    const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;

    if (backBtn) {
      backBtn.disabled = this.currentStep === 1;
    }

    if (nextBtn) {
      if (this.currentStep === this.totalSteps) {
        nextBtn.textContent = 'Finish';
      } else {
        nextBtn.textContent = 'Next';
      }
    }

    if (cancelBtn && this.currentStep === this.totalSteps) {
      cancelBtn.style.display = 'none';
    }
  }

  private nextStep(): void {
    if (this.currentStep === 2) {
      // Start backend download
      wizardAPI.startBackendDownload();
    } else if (this.currentStep === 4 && this.installationType === 'portable') {
      // Skip Python setup for portable install
      this.currentStep++;
    } else if (this.currentStep === 5) {
      // Start installation
      wizardAPI.startInstallation();
    } else if (this.currentStep === this.totalSteps) {
      // Finish
      const launchNow = (document.getElementById('launchNow') as HTMLInputElement)?.checked || false;
      wizardAPI.finish(launchNow);
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateUI();
      wizardAPI.nextStep();
    }
  }

  private previousStep(): void {
    if (this.currentStep > 1) {
      if (this.currentStep === 5 && this.installationType === 'portable') {
        // Skip Python setup for portable install when going back
        this.currentStep--;
      }
      this.currentStep--;
      this.updateUI();
      wizardAPI.previousStep();
    }
  }

  private updateDownloadProgress(data: any): void {
    const subtitle = document.getElementById('step3Subtitle');
    if (subtitle) {
      subtitle.textContent = data.message || 'Downloading...';
    }
  }

  private updateInstallationProgress(data: any): void {
    const { task, status, message } = data;

    if (task) {
      const taskEl = document.getElementById(`task-${task}`);
      if (taskEl) {
        taskEl.classList.remove('pending', 'active', 'completed', 'error');
        taskEl.classList.add(status);

        const icon = taskEl.querySelector('.task-icon');
        const statusText = taskEl.querySelector('.task-status');

        if (icon) {
          icon.classList.remove('pending', 'active', 'completed', 'error');
          icon.classList.add(status);

          if (status === 'pending') {
            icon.textContent = '◯';
          } else if (status === 'active') {
            icon.textContent = '⟳';
          } else if (status === 'completed') {
            icon.textContent = '✓';
          } else if (status === 'error') {
            icon.textContent = '✗';
          }
        }

        if (statusText && message) {
          statusText.textContent = message;
        }
      }
    }
  }

  private addLogLine(message: string, type: string = 'info'): void {
    this.logLines.push(message);

    const logOutput = document.getElementById('logOutput');
    if (logOutput) {
      const logLine = document.createElement('div');
      logLine.className = `log-line ${type}`;
      logLine.textContent = message;
      logOutput.appendChild(logLine);

      // Auto-scroll to bottom
      logOutput.scrollTop = logOutput.scrollHeight;
    }
  }

  private showError(error: string): void {
    console.error('Wizard error:', error);
    this.addLogLine(error, 'error');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new WizardRenderer();
});
