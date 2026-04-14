import { Component, inject, signal, input, effect, OnInit } from '@angular/core';
import { AuthService, LabGroupService } from '@noatgnu/cupcake-core';
import {
  FavouriteMetadataOption,
  FavouriteMetadataOptionService,
  MetadataColumn
} from '@noatgnu/cupcake-vanilla';
import { ExcelService } from '../../core/services/excel.service';
import { ToastService } from '../../core/services/toast.service';

type FavoriteTab = 'user' | 'labGroup' | 'global';

@Component({
  selector: 'app-favorites-panel',
  imports: [],
  templateUrl: './favorites-panel.html',
  styleUrl: './favorites-panel.scss',
})
export class FavoritesPanel implements OnInit {
  private authService = inject(AuthService);
  private labGroupService = inject(LabGroupService);
  private favouriteService = inject(FavouriteMetadataOptionService);
  private excelService = inject(ExcelService);
  private toastService = inject(ToastService);

  readonly column = input<MetadataColumn | null>(null);

  readonly isLoading = signal(false);
  readonly activeTab = signal<FavoriteTab>('user');
  readonly userFavorites = signal<FavouriteMetadataOption[]>([]);
  readonly labGroupFavorites = signal<FavouriteMetadataOption[]>([]);
  readonly globalFavorites = signal<FavouriteMetadataOption[]>([]);
  readonly userLabGroups = signal<number[]>([]);

  constructor() {
    effect(() => {
      const col = this.column();
      if (col?.name) {
        this.loadFavorites(col.name);
      } else {
        this.userFavorites.set([]);
        this.labGroupFavorites.set([]);
        this.globalFavorites.set([]);
      }
    });
  }

  ngOnInit(): void {
    this.loadUserLabGroups();
  }

  private loadUserLabGroups(): void {
    this.labGroupService.getMyLabGroups({ limit: 10 }).subscribe({
      next: (response) => {
        const ids = response.results.map(g => g.id!);
        this.userLabGroups.set(ids);
      },
      error: () => this.userLabGroups.set([])
    });
  }

  private loadFavorites(columnName: string): void {
    this.isLoading.set(true);
    const currentUser = this.authService.getCurrentUser();

    if (currentUser?.id) {
      this.favouriteService.getFavouriteMetadataOptions({
        name: columnName,
        userId: currentUser.id,
        limit: 10
      }).subscribe({
        next: (response) => this.userFavorites.set(response.results),
        error: () => this.userFavorites.set([])
      });
    }

    const labGroups = this.userLabGroups();
    if (labGroups.length > 0) {
      this.favouriteService.getFavouriteMetadataOptions({
        name: columnName,
        labGroupId: labGroups[0],
        limit: 10
      }).subscribe({
        next: (response) => this.labGroupFavorites.set(response.results),
        error: () => this.labGroupFavorites.set([])
      });
    }

    this.favouriteService.getFavouriteMetadataOptions({
      name: columnName,
      isGlobal: true,
      limit: 10
    }).subscribe({
      next: (response) => {
        this.globalFavorites.set(response.results);
        this.isLoading.set(false);
        this.setInitialTab();
      },
      error: () => {
        this.globalFavorites.set([]);
        this.isLoading.set(false);
        this.setInitialTab();
      }
    });
  }

  private setInitialTab(): void {
    if (this.userFavorites().length > 0) {
      this.activeTab.set('user');
    } else if (this.labGroupFavorites().length > 0) {
      this.activeTab.set('labGroup');
    } else if (this.globalFavorites().length > 0) {
      this.activeTab.set('global');
    }
  }

  setTab(tab: FavoriteTab): void {
    this.activeTab.set(tab);
  }

  get currentFavorites(): FavouriteMetadataOption[] {
    switch (this.activeTab()) {
      case 'user': return this.userFavorites();
      case 'labGroup': return this.labGroupFavorites();
      case 'global': return this.globalFavorites();
    }
  }

  get hasFavorites(): boolean {
    return this.userFavorites().length > 0 ||
           this.labGroupFavorites().length > 0 ||
           this.globalFavorites().length > 0;
  }

  getDisplayValue(favorite: FavouriteMetadataOption): string {
    return favorite.displayValue || favorite.value || '';
  }

  async insertFavorite(favorite: FavouriteMetadataOption): Promise<void> {
    const value = favorite.value || '';
    if (!value) return;

    try {
      const selection = await this.excelService.getSelectedRange();
      const match = selection.address.match(/([A-Z]+)(\d+)/);
      if (match) {
        const col = this.columnLetterToIndex(match[1]);
        const row = parseInt(match[2], 10) - 1;
        await this.excelService.updateCell(row, col, value);
        this.toastService.success('Value inserted');
      }
    } catch {
      this.toastService.error('Failed to insert value');
    }
  }

  private columnLetterToIndex(letters: string): number {
    return letters.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
  }
}
