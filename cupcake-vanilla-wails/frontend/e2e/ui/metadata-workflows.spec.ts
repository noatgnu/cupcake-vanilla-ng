import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { basename, join } from 'path';
import { ensureLoggedIn } from '../helpers/admin';
import { apiGet, getTable, MetadataTable, savedDownloads, taskIds, waitForNewDownload, waitForTask } from '../helpers/backend-api';
import {
  createTable,
  createTableFromTemplate,
  createTemplateFromSchemas,
  dismissDialogs,
  exportTable,
  importFile,
  openTable,
  prepareMetadataFromManagement,
} from '../helpers/main-app';

const FIXTURES_DIR = process.env['E2E_FIXTURES_DIR'] || join(__dirname, '..', '..', '..', '..', 'e2e', 'fixtures', 'sdrf');
const TASK_TIMEOUT = 10 * 60 * 1000;

interface Sdrf {
  headers: string[];
  rows: string[][];
}

interface TemplateSummary {
  id: number;
  name: string;
  column_count: number;
}

function parseSdrf(content: string): Sdrf {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  const [header, ...rows] = lines.map(line => line.split('\t'));
  return { headers: header.map(h => h.trim().toLowerCase()), rows };
}

function fixture(name: string): { content: Buffer; sdrf: Sdrf } {
  const content = readFileSync(join(FIXTURES_DIR, name));
  return { content, sdrf: parseSdrf(content.toString('utf8')) };
}

function sorted(values: string[]): string[] {
  return [...values].sort();
}

const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

async function importSdrfIntoNewTable(fixtureName: string): Promise<{ table: MetadataTable; sdrf: Sdrf }> {
  const { content, sdrf } = fixture(fixtureName);
  const tableId = await createTable(`UI import ${fixtureName} ${unique()}`);
  const before = await taskIds();

  await importFile('sdrf', fixtureName, content, true);
  const task = await waitForTask(tableId, 'IMPORT_SDRF', TASK_TIMEOUT, before);
  expect(task.status, task.error_message ?? '').toBe('SUCCESS');

  return { table: await getTable(tableId), sdrf };
}

test.describe('Metadata workflows in the desktop app', () => {
  test.beforeAll(async () => {
    await ensureLoggedIn();
  });

  test.beforeEach(async () => {
    await dismissDialogs();
  });

  for (const fixtureName of [
    'PXD019185_PXD018883.sdrf.tsv',
    'PXD002137.sdrf.tsv',
    'MSV000079033-Blood-Plasma-TMT10.sdrf.tsv',
    'PDC000126.sdrf.tsv',
  ]) {
    test(`imports ${fixtureName} with every sample and column`, async () => {
      test.setTimeout(TASK_TIMEOUT + 120000);
      const { table, sdrf } = await importSdrfIntoNewTable(fixtureName);

      expect(table.sample_count).toBe(sdrf.rows.length);
      expect(table.columns.length).toBe(sdrf.headers.length);
      expect(sorted(table.columns.map(c => c.name.toLowerCase()))).toEqual(sorted(sdrf.headers));
    });
  }

  test('exports an imported table as SDRF with the same samples and columns', async () => {
    test.setTimeout(2 * TASK_TIMEOUT);
    const { table, sdrf } = await importSdrfIntoNewTable('PXD002137.sdrf.tsv');
    await openTable(table.id);

    const downloadsBefore = (await savedDownloads()).length;
    const tasksBefore = await taskIds();
    await exportTable('sdrf');
    const task = await waitForTask(table.id, 'EXPORT_SDRF', TASK_TIMEOUT, tasksBefore);
    expect(task.status, task.error_message ?? '').toBe('SUCCESS');

    const saved = await waitForNewDownload(downloadsBefore, 60000);
    expect(basename(saved)).toMatch(/\.(tsv|txt)$/i);
    const exported = parseSdrf(readFileSync(saved, 'utf8'));

    expect(exported.rows.length).toBe(sdrf.rows.length);
    expect(sorted(exported.headers)).toEqual(sorted(sdrf.headers));

    const sourceIndex = sdrf.headers.indexOf('source name');
    const exportedSourceIndex = exported.headers.indexOf('source name');
    expect(exported.rows.map(r => r[exportedSourceIndex])).toEqual(sdrf.rows.map(r => r[sourceIndex]));
  });

  test('exports an imported table as Excel and imports the workbook back unchanged', async () => {
    test.setTimeout(3 * TASK_TIMEOUT);
    const { table } = await importSdrfIntoNewTable('PXD019185_PXD018883.sdrf.tsv');
    await openTable(table.id);

    const downloadsBefore = (await savedDownloads()).length;
    const exportTasksBefore = await taskIds();
    await exportTable('excel');
    const exportTask = await waitForTask(table.id, 'EXPORT_EXCEL', TASK_TIMEOUT, exportTasksBefore);
    expect(exportTask.status, exportTask.error_message ?? '').toBe('SUCCESS');

    const saved = await waitForNewDownload(downloadsBefore, 60000);
    expect(basename(saved)).toMatch(/\.xlsx$/i);
    const workbook = readFileSync(saved);
    expect(workbook.subarray(0, 2).toString('latin1')).toBe('PK');

    await openTable(table.id);
    const importTasksBefore = await taskIds();
    await importFile('excel', basename(saved), workbook, false);
    const importTask = await waitForTask(table.id, 'IMPORT_EXCEL', TASK_TIMEOUT, importTasksBefore);
    expect(importTask.status, importTask.error_message ?? '').toBe('SUCCESS');

    const reimported = await getTable(table.id);
    expect(reimported.sample_count).toBe(table.sample_count);
    expect(sorted(reimported.columns.map(c => c.name))).toEqual(sorted(table.columns.map(c => c.name)));
  });

  test('creates a table template from a schema and a table from that template', async () => {
    test.setTimeout(24 * 60 * 1000);
    const loaded = await prepareMetadataFromManagement();
    expect(loaded.schemas).toBeGreaterThan(0);
    expect(loaded.columnTemplates).toBeGreaterThan(0);
    const templateName = `UI template ${unique()}`;
    await createTemplateFromSchemas(templateName);

    const templates = await apiGet<{ results: TemplateSummary[] }>(
      `metadata-table-templates/?search=${encodeURIComponent(templateName)}&limit=10`,
    );
    const template = templates.results.find(t => t.name === templateName);
    expect(template, 'template should be saved').toBeTruthy();
    expect(template!.column_count).toBeGreaterThan(0);

    const tableName = `UI from template ${unique()}`;
    await createTableFromTemplate(templateName, tableName, 6);

    const tables = await apiGet<{ results: MetadataTable[] }>(
      `metadata-tables/?search=${encodeURIComponent(tableName)}&limit=10`,
    );
    const summary = tables.results.find(t => t.name === tableName);
    expect(summary, 'table should be created from the template').toBeTruthy();
    const table = await getTable(summary!.id);
    expect(table.sample_count).toBe(6);
    expect(table.columns.length).toBe(template!.column_count);
  });
});
