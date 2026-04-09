import { Injectable, signal } from '@angular/core';

declare const Excel: any;

export interface CellData {
  row: number;
  column: number;
  value: any;
}

export interface WorksheetData {
  name: string;
  headers: string[];
  rows: any[][];
  rowCount: number;
  columnCount: number;
}

export interface CellReference {
  row: number;
  column: number;
}

export interface ValidationRule {
  type: 'list' | 'custom';
  values?: string[];
  formula?: string;
  showErrorAlert?: boolean;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  private _isReady = signal<boolean>(false);
  readonly isReady = this._isReady.asReadonly();

  constructor() {
    this.checkOfficeReady();
  }

  private checkOfficeReady(): void {
    if (typeof Excel !== 'undefined') {
      this._isReady.set(true);
    }
  }

  async getActiveWorksheet(): Promise<any> {
    return Excel.run(async (context: any) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      sheet.load('name');
      await context.sync();
      return sheet;
    });
  }

  async getActiveWorksheetName(): Promise<string> {
    return Excel.run(async (context: any) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      sheet.load('name');
      await context.sync();
      return sheet.name;
    });
  }

  async readWorksheetData(startRow: number = 0, maxRows: number = 1000): Promise<WorksheetData> {
    return Excel.run(async (context: any) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      sheet.load('name');

      const usedRange = sheet.getUsedRange();
      usedRange.load(['values', 'rowCount', 'columnCount']);

      await context.sync();

      const values = usedRange.values;
      const headers = values[0] || [];
      const rows = values.slice(1, Math.min(startRow + maxRows + 1, values.length));

      return {
        name: sheet.name,
        headers,
        rows,
        rowCount: usedRange.rowCount,
        columnCount: usedRange.columnCount
      };
    });
  }

  async writeTableToWorksheet(
    headers: string[],
    data: any[][],
    startCell: string = 'A1'
  ): Promise<void> {
    return Excel.run(async (context: any) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();

      const allData = [headers, ...data];
      const endColumn = this.columnIndexToLetter(headers.length - 1);
      const endRow = allData.length;
      const rangeAddress = `${startCell}:${endColumn}${endRow}`;

      const range = sheet.getRange(rangeAddress);
      range.values = allData;

      const headerRange = sheet.getRange(`A1:${endColumn}1`);
      headerRange.format.font.bold = true;
      headerRange.format.fill.color = '#4472C4';
      headerRange.format.font.color = '#FFFFFF';

      await this.applyTableBoundary(context, sheet, headers.length, allData.length);

      await context.sync();
    });
  }

  private async applyTableBoundary(
    context: any,
    sheet: any,
    columnCount: number,
    rowCount: number
  ): Promise<void> {
    const endColumn = this.columnIndexToLetter(columnCount - 1);

    const headerRange = sheet.getRange(`A1:${endColumn}1`);
    headerRange.format.protection.locked = true;

    const tableRange = sheet.getRange(`A1:${endColumn}${rowCount}`);
    tableRange.format.borders.getItem('EdgeTop').style = 'Continuous';
    tableRange.format.borders.getItem('EdgeTop').weight = 'Medium';
    tableRange.format.borders.getItem('EdgeTop').color = '#2F5496';

    tableRange.format.borders.getItem('EdgeBottom').style = 'Continuous';
    tableRange.format.borders.getItem('EdgeBottom').weight = 'Medium';
    tableRange.format.borders.getItem('EdgeBottom').color = '#2F5496';

    tableRange.format.borders.getItem('EdgeLeft').style = 'Continuous';
    tableRange.format.borders.getItem('EdgeLeft').weight = 'Medium';
    tableRange.format.borders.getItem('EdgeLeft').color = '#2F5496';

    tableRange.format.borders.getItem('EdgeRight').style = 'Continuous';
    tableRange.format.borders.getItem('EdgeRight').weight = 'Medium';
    tableRange.format.borders.getItem('EdgeRight').color = '#2F5496';

    const headerBottomRange = sheet.getRange(`A1:${endColumn}1`);
    headerBottomRange.format.borders.getItem('EdgeBottom').style = 'Continuous';
    headerBottomRange.format.borders.getItem('EdgeBottom').weight = 'Thick';
    headerBottomRange.format.borders.getItem('EdgeBottom').color = '#1F4E79';

    const warningCol = this.columnIndexToLetter(columnCount);
    const warningRange = sheet.getRange(`${warningCol}1`);
    warningRange.values = [['⬅ SDRF Table Boundary']];
    warningRange.format.font.color = '#C00000';
    warningRange.format.font.italic = true;
    warningRange.format.font.size = 9;

    const belowTableRow = rowCount + 1;
    const belowRange = sheet.getRange(`A${belowTableRow}`);
    belowRange.values = [['⬆ End of SDRF Data - Do not edit below']];
    belowRange.format.font.color = '#C00000';
    belowRange.format.font.italic = true;
    belowRange.format.font.size = 9;

    if (rowCount > 1) {
      const dataRange = sheet.getRange(`A2:${endColumn}${rowCount}`);
      dataRange.format.protection.locked = false;
    }
  }

  async protectWorksheet(): Promise<void> {
    return Excel.run(async (context: any) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      sheet.protection.protect({
        allowInsertRows: false,
        allowInsertColumns: false,
        allowDeleteRows: false,
        allowDeleteColumns: false,
        allowFormatCells: true,
        allowFormatColumns: true,
        allowFormatRows: true,
        allowEditObjects: false,
        allowEditScenarios: false,
        selectionMode: 'Normal'
      });
      await context.sync();
    });
  }

  async unprotectWorksheet(): Promise<void> {
    return Excel.run(async (context: any) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      sheet.protection.unprotect();
      await context.sync();
    });
  }

  async isWorksheetProtected(): Promise<boolean> {
    return Excel.run(async (context: any) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      sheet.protection.load('protected');
      await context.sync();
      return sheet.protection.protected;
    });
  }

  async updateCell(row: number, column: number, value: any): Promise<void> {
    return Excel.run(async (context: any) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const cell = sheet.getCell(row, column);
      cell.values = [[value]];
      await context.sync();
    });
  }

  async getCellValue(row: number, column: number): Promise<any> {
    return Excel.run(async (context: any) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const cell = sheet.getCell(row, column);
      cell.load('values');
      await context.sync();
      return cell.values[0][0];
    });
  }

  async highlightCells(cells: CellReference[], color: string): Promise<void> {
    return Excel.run(async (context: any) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();

      for (const cell of cells) {
        const range = sheet.getCell(cell.row, cell.column);
        range.format.fill.color = color;
      }

      await context.sync();
    });
  }

  async clearHighlights(startRow: number = 1): Promise<void> {
    return Excel.run(async (context: any) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const usedRange = sheet.getUsedRange();
      usedRange.load(['rowCount', 'columnCount']);
      await context.sync();

      const dataRange = sheet.getRangeByIndexes(
        startRow,
        0,
        usedRange.rowCount - startRow,
        usedRange.columnCount
      );
      dataRange.format.fill.clear();

      await context.sync();
    });
  }

  async applyDataValidation(
    column: number,
    startRow: number,
    endRow: number,
    rule: ValidationRule
  ): Promise<void> {
    return Excel.run(async (context: any) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const columnLetter = this.columnIndexToLetter(column);
      const rangeAddress = `${columnLetter}${startRow + 1}:${columnLetter}${endRow + 1}`;
      const range = sheet.getRange(rangeAddress);

      if (rule.type === 'list' && rule.values) {
        range.dataValidation.rule = {
          list: {
            inCellDropDown: true,
            source: rule.values.join(',')
          }
        };
      }

      if (rule.showErrorAlert && rule.errorMessage) {
        range.dataValidation.errorAlert = {
          showAlert: true,
          style: 'Stop',
          message: rule.errorMessage
        };
      }

      await context.sync();
    });
  }

  async clearDataValidation(): Promise<void> {
    return Excel.run(async (context: any) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const usedRange = sheet.getUsedRange();
      usedRange.dataValidation.clear();
      await context.sync();
    });
  }

  async createTable(name: string, headers: string[], data: any[][]): Promise<void> {
    return Excel.run(async (context: any) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();

      const allData = [headers, ...data];
      const endColumn = this.columnIndexToLetter(headers.length - 1);
      const endRow = allData.length;
      const rangeAddress = `A1:${endColumn}${endRow}`;

      const range = sheet.getRange(rangeAddress);
      range.values = allData;

      const table = sheet.tables.add(rangeAddress, true);
      table.name = name;

      await context.sync();
    });
  }

  async getSelectedRange(): Promise<{ address: string; values: any[][] }> {
    return Excel.run(async (context: any) => {
      const range = context.workbook.getSelectedRange();
      range.load(['address', 'values']);
      await context.sync();
      return {
        address: range.address,
        values: range.values
      };
    });
  }

  private columnIndexToLetter(index: number): string {
    let letter = '';
    let temp = index;
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  }
}
