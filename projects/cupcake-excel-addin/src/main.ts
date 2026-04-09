import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

declare const Office: any;

async function bootstrap(): Promise<void> {
  try {
    await bootstrapApplication(App, appConfig);
  } catch (err) {
    console.error('Bootstrap failed:', err);
  }
}

if (typeof Office !== 'undefined' && Office.onReady) {
  Office.onReady(() => {
    bootstrap();
  });
} else {
  bootstrap();
}
