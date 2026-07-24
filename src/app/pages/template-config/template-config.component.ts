import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CmsService } from '../../services/cms.service';
import { NavigationItem, TemplateConfig } from '../../models/cms.models';

@Component({
  selector: 'app-template-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="template-config-container">
      <div *ngIf="cms.activeStoreSignal() as store; else noBlog">
        <!-- LIVE PREVIEW -->
        <div class="preview-section">
          <h3>Live Preview</h3>
          <div class="template-preview">
            <!-- Top Nav -->
            <div class="preview-top-nav">
              <a href="#" class="nav-link">Home</a>
              <a href="#" class="nav-link" *ngFor="let pageId of config?.topNavPageIds">
                {{ getPageLabel(pageId) }}
              </a>
              <a href="#" class="social-link" style="margin-left: auto;">f</a>
            </div>

            <!-- Logo -->
            <div class="preview-logo-section">
              <p class="preview-logo-text" [style.color]="config?.logoColor || '#d32f2f'">
                {{ config?.logoText || store.name }}
              </p>
            </div>

            <!-- Secondary Nav -->
            <div class="preview-secondary-nav">
              <span class="nav-icon">⌂</span>
              <a href="#" class="nav-item" *ngFor="let item of sortedSecondaryNav">
                {{ item.label }}
              </a>
              <span class="search-icon" style="margin-left: auto;">🔍</span>
            </div>
          </div>
        </div>

        <!-- CONFIGURATION PANEL -->
        <div class="config-section">
          <h3>Configure Template</h3>

          <!-- Logo Configuration -->
          <div class="config-group">
            <h4>Logo Settings</h4>
            <label>
              Logo Text
              <input
                type="text"
                [(ngModel)]="config.logoText"
                placeholder="e.g., My Restaurant"
                class="input-field"
              />
            </label>
            <label>
              Logo Color
              <div class="color-picker-wrapper">
                <input
                  type="color"
                  [(ngModel)]="config.logoColor"
                  class="color-picker"
                />
                <span class="color-value">{{ config.logoColor }}</span>
              </div>
            </label>
          </div>

          <!-- Top Navigation Pages -->
          <div class="config-group">
            <h4>Top Navigation (Select Pages)</h4>
            <div class="checkbox-group">
              <label class="checkbox-item">
                <input type="checkbox" disabled checked />
                <span>Home (always shown)</span>
              </label>
              <label class="checkbox-item" *ngFor="let page of allPages">
                <input
                  type="checkbox"
                  [checked]="isInTopNav(page.id)"
                  (change)="toggleTopNavPage(page.id)"
                />
                <span>{{ page.title }}</span>
              </label>
              <p class="empty-message" *ngIf="allPages.length === 0">No pages available. Create pages first.</p>
            </div>
          </div>

          <!-- Secondary Navigation Items -->
          <div class="config-group">
            <h4>Secondary Navigation (Custom Menu)</h4>
            <div class="nav-items-list">
              <div class="nav-item-row" *ngFor="let item of sortedSecondaryNav; let idx = index">
                <input
                  type="text"
                  [(ngModel)]="item.label"
                  placeholder="Label"
                  class="input-small"
                />
                <input
                  type="text"
                  [(ngModel)]="item.url"
                  placeholder="URL (optional)"
                  class="input-small"
                />
                <input
                  type="number"
                  [(ngModel)]="item.order"
                  class="input-small order-input"
                  min="1"
                />
                <button (click)="updateNavItem(item)" class="btn-small btn-save">Save</button>
                <button (click)="removeSecondaryNavItem(item.id)" class="btn-small btn-delete">Delete</button>
              </div>
              <button (click)="addSecondaryNavItem()" class="btn-add-item">+ Add Item</button>
            </div>
          </div>

          <!-- Sidebar Pages -->
          <div class="config-group">
            <h4>Right Sidebar (Select Pages)</h4>
            <p class="info-text">If no pages selected, sidebar will not appear on the site.</p>
            <div class="checkbox-group">
              <label class="checkbox-item" *ngFor="let page of allPages">
                <input
                  type="checkbox"
                  [checked]="isInSidebar(page.id)"
                  (change)="toggleSidebarPage(page.id)"
                />
                <span>{{ page.title }}</span>
              </label>
              <p class="empty-message" *ngIf="allPages.length === 0">No pages available. Create pages first.</p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button (click)="saveConfig()" class="btn btn-primary">Save Configuration</button>
            <button (click)="cancel()" class="btn btn-secondary">Cancel</button>
          </div>
        </div>
      </div>

      <ng-template #noBlog>
        <p class="error-message">No active store selected.</p>
      </ng-template>
    </section>
  `,
  styles: [
    `.template-config-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }`,
    `.preview-section { margin-bottom: 3rem; }`,
    `.preview-section h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 1rem; }`,
    `.template-preview { border: 1px solid #ddd; border-radius: 0.5rem; overflow: hidden; background: #f9f9f9; }`,
    `.preview-top-nav { display: flex; gap: 1.5rem; align-items: center; background: #2b2b2b; padding: 0.5rem 1rem; justify-content: flex-end; }`,
    `.preview-top-nav .nav-link { color: #fff; text-decoration: none; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }`,
    `.preview-top-nav .social-link { color: #fff; font-size: 1.25rem; font-weight: bold; }`,
    `.preview-logo-section { background: #f5f5f5; padding: 2rem 1rem; text-align: center; }`,
    `.preview-logo-text { margin: 0; font-size: 2rem; font-weight: bold; font-style: italic; }`,
    `.preview-secondary-nav { display: flex; gap: 1rem; align-items: center; background: #1a1a1a; padding: 0.5rem 1rem; }`,
    `.preview-secondary-nav .nav-icon { color: #fff; font-size: 1.25rem; }`,
    `.preview-secondary-nav .nav-item { color: #fff; text-decoration: none; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }`,
    `.preview-secondary-nav .search-icon { color: #fff; cursor: pointer; }`,
    `.config-section { background: #fff; border: 1px solid #ddd; border-radius: 0.5rem; padding: 2rem; }`,
    `.config-section h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 2rem; border-bottom: 2px solid #eee; padding-bottom: 1rem; }`,
    `.config-group { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #eee; }`,
    `.config-group:last-of-type { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }`,
    `.config-group h4 { margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600; }`,
    `.input-field { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 0.4rem; margin-top: 0.5rem; }`,
    `label { display: block; margin-bottom: 1rem; font-weight: 500; }`,
    `.color-picker-wrapper { display: flex; align-items: center; gap: 1rem; margin-top: 0.5rem; }`,
    `.color-picker { width: 60px; height: 40px; border: none; border-radius: 0.4rem; cursor: pointer; }`,
    `.color-value { font-family: monospace; font-size: 0.9rem; color: #666; }`,
    `.checkbox-group { display: grid; gap: 0.75rem; }`,
    `.checkbox-item { display: flex; align-items: center; gap: 0.5rem; font-weight: normal; cursor: pointer; }`,
    `.checkbox-item input[type="checkbox"] { cursor: pointer; }`,
    `.empty-message { color: #999; font-size: 0.9rem; margin: 1rem 0 0 0; }`,
    `.info-text { color: #666; font-size: 0.9rem; margin-bottom: 1rem; }`,
    `.nav-items-list { background: #f9f9f9; border: 1px solid #eee; border-radius: 0.4rem; padding: 1rem; }`,
    `.nav-item-row { display: grid; grid-template-columns: 2fr 2fr 1fr auto auto; gap: 0.5rem; margin-bottom: 0.75rem; align-items: center; }`,
    `.input-small { padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.3rem; font-size: 0.9rem; }`,
    `.order-input { text-align: center; }`,
    `.btn-small { padding: 0.4rem 0.8rem; border: none; border-radius: 0.3rem; cursor: pointer; font-size: 0.85rem; font-weight: 600; }`,
    `.btn-save { background: #4CAF50; color: white; }`,
    `.btn-save:hover { background: #45a049; }`,
    `.btn-delete { background: #f44336; color: white; }`,
    `.btn-delete:hover { background: #da190b; }`,
    `.btn-add-item { display: block; width: 100%; padding: 0.75rem; background: #2196F3; color: white; border: none; border-radius: 0.4rem; cursor: pointer; font-weight: 600; margin-top: 0.5rem; }`,
    `.btn-add-item:hover { background: #0b7dda; }`,
    `.action-buttons { display: flex; gap: 1rem; margin-top: 2rem; }`,
    `.btn { padding: 0.75rem 1.5rem; border: none; border-radius: 0.4rem; font-weight: 600; cursor: pointer; }`,
    `.btn-primary { background: #1d4ed8; color: white; }`,
    `.btn-primary:hover { background: #1e40af; }`,
    `.btn-secondary { background: #e5e7eb; color: #374151; }`,
    `.btn-secondary:hover { background: #d1d5db; }`,
    `.error-message { color: #f87171; font-weight: 600; }`,
    `@media (max-width: 768px) { .nav-item-row { grid-template-columns: 1fr; } .action-buttons { flex-direction: column; } }`
  ]
})
export class TemplateConfigComponent implements OnInit {
  readonly cms = inject(CmsService);

  config: TemplateConfig = {};
  allPages: any[] = [];
  sortedSecondaryNav: NavigationItem[] = [];

  ngOnInit(): void {
    this.loadConfig();
  }

  private loadConfig(): void {
    const store = this.cms.activeStoreSignal();
    if (!store) return;

    this.config = store.templateConfig || {};
    if (!this.config.topNavPageIds) this.config.topNavPageIds = [];
    if (!this.config.secondaryNavItems) this.config.secondaryNavItems = [];
    if (!this.config.sidebarPageIds) this.config.sidebarPageIds = [];

    this.allPages = this.cms.pagesSignal().filter((p) => p.storeId === store.id);
    this.updateSortedNav();
  }

  private updateSortedNav(): void {
    this.sortedSecondaryNav = [...(this.config.secondaryNavItems || [])].sort((a, b) => a.order - b.order);
  }

  getPageLabel(pageId: string): string {
    return this.allPages.find((p) => p.id === pageId)?.title || pageId;
  }

  isInTopNav(pageId: string): boolean {
    return this.config.topNavPageIds?.includes(pageId) || false;
  }

  toggleTopNavPage(pageId: string): void {
    if (!this.config.topNavPageIds) this.config.topNavPageIds = [];
    if (this.config.topNavPageIds.includes(pageId)) {
      this.config.topNavPageIds = this.config.topNavPageIds.filter((id) => id !== pageId);
    } else {
      this.config.topNavPageIds.push(pageId);
    }
  }

  isInSidebar(pageId: string): boolean {
    return this.config.sidebarPageIds?.includes(pageId) || false;
  }

  toggleSidebarPage(pageId: string): void {
    if (!this.config.sidebarPageIds) this.config.sidebarPageIds = [];
    if (this.config.sidebarPageIds.includes(pageId)) {
      this.config.sidebarPageIds = this.config.sidebarPageIds.filter((id) => id !== pageId);
    } else {
      this.config.sidebarPageIds.push(pageId);
    }
  }

  addSecondaryNavItem(): void {
    if (!this.config.secondaryNavItems) this.config.secondaryNavItems = [];
    const newItem: NavigationItem = {
      id: `nav-${Date.now()}`,
      label: 'New Item',
      url: '/',
      order: this.config.secondaryNavItems.length + 1
    };
    this.config.secondaryNavItems.push(newItem);
    this.updateSortedNav();
  }

  updateNavItem(item: NavigationItem): void {
    if (!this.config.secondaryNavItems) return;
    const idx = this.config.secondaryNavItems.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      this.config.secondaryNavItems[idx] = item;
      this.updateSortedNav();
    }
  }

  removeSecondaryNavItem(itemId: string): void {
    if (!this.config.secondaryNavItems) return;
    this.config.secondaryNavItems = this.config.secondaryNavItems.filter((i) => i.id !== itemId);
    this.updateSortedNav();
  }

  async saveConfig(): Promise<void> {
    const store = this.cms.activeStoreSignal();
    if (!store) return;
    await this.cms.setTemplateConfig(store.id, this.config);
    alert('Template configuration saved!');
  }

  cancel(): void {
    this.loadConfig();
  }
}
