import { Page } from '@playwright/test';

export async function setupOfficeMock(page: Page): Promise<void> {
  await page.route('**/office-js/**', async (route) => {
    const url = route.request().url();
    if (url.endsWith('office.js')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `
          window.Office = {
            onReady: function(callback) {
              if (callback) setTimeout(function() { callback({ host: 'Excel', platform: 'PC' }); }, 10);
              return Promise.resolve({ host: 'Excel', platform: 'PC' });
            },
            HostType: { Excel: 'Excel', Word: 'Word', PowerPoint: 'PowerPoint' }
          };
          window.Excel = {
            run: function(callback) {
              var context = {
                workbook: {
                  worksheets: {
                    getActiveWorksheet: function() {
                      return {
                        name: 'Sheet1',
                        load: function() { return this; },
                        getRange: function() { return { values: [['']], load: function() { return this; } }; },
                        getUsedRange: function() { return { values: [['']], rowCount: 1, columnCount: 1, load: function() { return this; } }; },
                        getCell: function() { return { values: [['']], load: function() { return this; } }; }
                      };
                    }
                  },
                  getSelectedRange: function() { return { address: 'A1', values: [['']], load: function() { return this; } }; }
                },
                sync: function() { return Promise.resolve(); }
              };
              return Promise.resolve(callback(context));
            }
          };
        `
      });
    } else {
      await route.fulfill({ status: 200, body: '' });
    }
  });

  await page.addInitScript(() => {
    const originalReplaceState = window.history.replaceState?.bind(window.history);
    const originalPushState = window.history.pushState?.bind(window.history);

    if (originalReplaceState) {
      Object.defineProperty(window.history, 'replaceState', {
        value: originalReplaceState,
        writable: false,
        configurable: false
      });
    }

    if (originalPushState) {
      Object.defineProperty(window.history, 'pushState', {
        value: originalPushState,
        writable: false,
        configurable: false
      });
    }
  });
}

export async function mockExcelRange(page: Page, address: string, values: any[][]): Promise<void> {
  await page.evaluate(
    ({ address, values }) => {
      (window as any).__mockRangeData = (window as any).__mockRangeData || {};
      (window as any).__mockRangeData[address] = values;
    },
    { address, values }
  );
}
