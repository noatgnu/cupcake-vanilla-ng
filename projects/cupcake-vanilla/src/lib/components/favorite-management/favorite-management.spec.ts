import { signal, WritableSignal } from '@angular/core';

interface FavoriteTable {
  id: number;
  name: string;
}

describe('FavoriteManagement', () => {
  let favorites: WritableSignal<FavoriteTable[]>;
  let isLoading: WritableSignal<boolean>;

  function addFavorite(table: FavoriteTable): void {
    favorites.update(list => [...list, table]);
  }

  function removeFavorite(tableId: number): void {
    favorites.update(list => list.filter(t => t.id !== tableId));
  }

  function isFavorite(tableId: number): boolean {
    return favorites().some(t => t.id === tableId);
  }

  beforeEach(() => {
    favorites = signal<FavoriteTable[]>([]);
    isLoading = signal(false);
  });

  it('should start with empty favorites', () => {
    expect(favorites().length).toBe(0);
  });

  it('should add favorite', () => {
    addFavorite({ id: 1, name: 'Table 1' });
    expect(favorites().length).toBe(1);
  });

  it('should remove favorite', () => {
    addFavorite({ id: 1, name: 'Table 1' });
    removeFavorite(1);
    expect(favorites().length).toBe(0);
  });

  it('should check if table is favorite', () => {
    expect(isFavorite(1)).toBeFalse();
    addFavorite({ id: 1, name: 'Table 1' });
    expect(isFavorite(1)).toBeTrue();
  });
});
