import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@noatgnu/cupcake-core';
import { ExcelService } from '../../core/services/excel.service';
import { TableBrowser } from '../table-browser/table-browser';

const PENDING_TABLE_KEY = 'cupcake-excel-pending-table-nav';
const TABLE_BROWSER_KEY = 'cupcake-excel-selected-table';

@Component({
  selector: 'app-imported-table-panel',
  imports: [TableBrowser],
  templateUrl: './imported-table-panel.html',
  styleUrl: './imported-table-panel.scss',
})
export class ImportedTablePanel implements OnInit {
  private excelService = inject(ExcelService);
  private router = inject(Router);
  private authService = inject(AuthService);

  readonly showBrowser = signal(false);
  readonly currentUser = this.authService.currentUser;

  ngOnInit(): void {
    this.initFromExcel();
  }

  private async initFromExcel(): Promise<void> {
    const pending = sessionStorage.getItem(PENDING_TABLE_KEY);
    if (pending) {
      sessionStorage.removeItem(PENDING_TABLE_KEY);
      const tableId = parseInt(pending, 10);
      if (!isNaN(tableId)) {
        localStorage.setItem(TABLE_BROWSER_KEY, tableId.toString());
        this.showBrowser.set(true);
        return;
      }
    }

    const sheetTableId = await this.excelService.getSheetTableId();
    if (sheetTableId !== null) {
      localStorage.setItem(TABLE_BROWSER_KEY, sheetTableId.toString());
    }
    this.showBrowser.set(true);
  }

  logout(): void {
    this.authService.logout().subscribe();
    this.router.navigate(['/login']);
  }

  get displayName(): string {
    const user = this.currentUser();
    return user?.firstName || user?.username || '';
  }
}
