/**
 * Persistent React Navigation State Store for Memomes Cloud File Explorer.
 * Preserves expanded tree nodes, selected folder, scroll position, view mode,
 * sorting, and search query across menu clicks and tab transitions.
 */

export interface FileExplorerState {
  expandedFolders: Set<string>;
  selectedFolderId: string;
  activeCategory: string;
  viewMode: 'tree' | 'grid' | 'list';
  scrollTop: number;
  sortBy: 'name' | 'date' | 'size' | 'type';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  isAdminInfraMode: boolean;
}

const STORAGE_KEY = 'memomes_file_explorer_state';

class FileExplorerNavStateStore {
  private state: FileExplorerState;
  private listeners: Array<(state: FileExplorerState) => void> = [];

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): FileExplorerState {
    const defaultExpanded = new Set<string>([
      'Documents', 'Images', 'Videos', 'PDF', 'Audio',
      'Spreadsheets', 'Presentations', 'SourceCode', 'Archives'
    ]);

    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            expandedFolders: new Set(parsed.expandedFolders || Array.from(defaultExpanded)),
            selectedFolderId: parsed.selectedFolderId || 'documents',
            activeCategory: parsed.activeCategory || 'Documents',
            viewMode: parsed.viewMode || 'grid',
            scrollTop: parsed.scrollTop || 0,
            sortBy: parsed.sortBy || 'date',
            sortOrder: parsed.sortOrder || 'desc',
            searchQuery: parsed.searchQuery || '',
            isAdminInfraMode: !!parsed.isAdminInfraMode
          };
        }
      }
    } catch (e) {
      console.debug('Failed to load navigation state', e);
    }

    return {
      expandedFolders: defaultExpanded,
      selectedFolderId: 'documents',
      activeCategory: 'Documents',
      viewMode: 'grid',
      scrollTop: 0,
      sortBy: 'date',
      sortOrder: 'desc',
      searchQuery: '',
      isAdminInfraMode: false
    };
  }

  public getState(): FileExplorerState {
    return { ...this.state, expandedFolders: new Set(this.state.expandedFolders) };
  }

  public setState(updates: Partial<FileExplorerState>) {
    this.state = {
      ...this.state,
      ...updates,
      expandedFolders: updates.expandedFolders
        ? new Set(updates.expandedFolders)
        : this.state.expandedFolders
    };
    this.persist();
    this.notify();
  }

  public toggleFolderExpand(folderId: string) {
    const next = new Set(this.state.expandedFolders);
    if (next.has(folderId)) {
      next.delete(folderId);
    } else {
      next.add(folderId);
    }
    this.state.expandedFolders = next;
    this.persist();
    this.notify();
  }

  public expandFolder(folderId: string) {
    if (!this.state.expandedFolders.has(folderId)) {
      const next = new Set(this.state.expandedFolders);
      next.add(folderId);
      this.state.expandedFolders = next;
      this.persist();
      this.notify();
    }
  }

  private persist() {
    try {
      if (typeof window !== 'undefined') {
        const payload = {
          ...this.state,
          expandedFolders: Array.from(this.state.expandedFolders)
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (e) {
      console.debug('Failed to persist navigation state', e);
    }
  }

  public subscribe(listener: (state: FileExplorerState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const current = this.getState();
    this.listeners.forEach(l => l(current));
  }
}

export const navStateStore = new FileExplorerNavStateStore();
