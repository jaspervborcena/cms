import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CmsService } from '../../services/cms.service';
import { Router, RouterLink } from '@angular/router';
import { Page, Post, TemplateConfig, NavigationItem } from '../../models/cms.models';

@Component({
  selector: 'app-template-designer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="template-designer">
      <div *ngIf="cms.activeStoreSignal() as store; else noStore" class="designer-container">
        <h2>Template Designer</h2>
        <p>Customize your store template. Add, edit, or remove sections.</p>

        <div class="designer-layout">
          <!-- PREVIEW PANE -->
          <div class="preview-pane">
            <h3>Live Preview</h3>
            <div class="template-preview">
              <!-- TOP NAVIGATION -->
              <nav class="top-nav" *ngIf="sections.topNav.enabled">
                <a href="#" class="nav-link">HOME</a>
                <ng-container *ngIf="topNavPages.length; else noTopNavPages">
                  <a *ngFor="let page of topNavPages" [routerLink]="['/site', store.id, page.slug]" class="nav-link">
                    {{ page.title }}
                  </a>
                </ng-container>
                <ng-template #noTopNavPages>
                  <span class="nav-note">Select pages to show here.</span>
                </ng-template>
                <a href="https://facebook.com" target="_blank" class="social-link" style="margin-left: auto;">f</a>
              </nav>

              <!-- LOGO SECTION -->
              <div class="logo-section" *ngIf="sections.logo.enabled">
                <p class="logo-text">{{ sections.logo.label || store.name }}</p>
              </div>

              <!-- SECONDARY NAVIGATION -->
              <nav class="secondary-nav" *ngIf="sections.secondaryNav.enabled">
                <a href="#" class="nav-icon">⌂</a>
                <a *ngFor="let item of templateConfig.secondaryNavItems" href="#" class="nav-item">{{ item.label }}</a>
                <div class="search-container">
                  <input type="search" placeholder="" class="search-input" />
                  <span class="search-icon">🔍</span>
                </div>
              </nav>

              <!-- UPDATE BUTTON -->
              <div class="update-banner" *ngIf="sections.updateButton.enabled">
                <button class="update-btn">Update</button>
              </div>

              <!-- POSTS SECTION -->
              <section class="posts-section" *ngIf="sections.posts.enabled">
                <div class="section-header">
                  <h2>{{ sections.posts.label }}</h2>
                  <a href="#" class="view-more">View More</a>
                </div>
                <div class="post-list">
                  <article *ngFor="let post of samplePosts" class="post-preview">
                    <h3 class="post-title">{{ post.title }}</h3>
                    <div class="post-content" [innerHTML]="post.content || post.excerpt"></div>
                  </article>
                  <div *ngIf="samplePosts.length === 0" class="empty">No posts yet.</div>
                </div>
              </section>

              <!-- FOOTER -->
              <footer class="site-footer" *ngIf="sections.footer.enabled">
                <p>© {{ store.name }} · Content and layout are styled by your chosen theme and template.</p>
              </footer>
            </div>
          </div>

          <!-- EDITOR PANE -->
          <div class="editor-pane">
            <h3>Template Elements</h3>
            <div class="element-controls">
              <!-- TOP NAV -->
              <div class="element-control">
                <div class="element-header">
                  <label class="element-toggle">
                    <input type="checkbox" [(ngModel)]="sections.topNav.enabled" />
                    <span>Top Navigation</span>
                  </label>
                  <button class="btn-edit" (click)="editElement('topNav')">Edit</button>
                </div>
              </div>

              <!-- LOGO -->
              <div class="element-control">
                <div class="element-header">
                  <label class="element-toggle">
                    <input type="checkbox" [(ngModel)]="sections.logo.enabled" />
                    <span>Logo Section</span>
                  </label>
                  <button class="btn-edit" (click)="editElement('logo')">Edit</button>
                </div>
              </div>

              <!-- SECONDARY NAV -->
              <div class="element-control">
                <div class="element-header">
                  <label class="element-toggle">
                    <input type="checkbox" [(ngModel)]="sections.secondaryNav.enabled" />
                    <span>Secondary Navigation</span>
                  </label>
                  <button class="btn-edit" (click)="editElement('secondaryNav')">Edit</button>
                </div>
              </div>

              <!-- UPDATE BUTTON -->
              <div class="element-control">
                <div class="element-header">
                  <label class="element-toggle">
                    <input type="checkbox" [(ngModel)]="sections.updateButton.enabled" />
                    <span>Update Button</span>
                  </label>
                  <button class="btn-edit" (click)="editElement('updateButton')">Edit</button>
                </div>
              </div>

              <!-- POSTS SECTION -->
              <div class="element-control">
                <div class="element-header">
                  <label class="element-toggle">
                    <input type="checkbox" [(ngModel)]="sections.posts.enabled" />
                    <span>Posts Section</span>
                  </label>
                  <button class="btn-edit" (click)="editElement('posts')">Edit</button>
                </div>
              </div>

              <!-- FOOTER -->
              <div class="element-control">
                <div class="element-header">
                  <label class="element-toggle">
                    <input type="checkbox" [(ngModel)]="sections.footer.enabled" />
                    <span>Footer</span>
                  </label>
                  <button class="btn-edit" (click)="editElement('footer')">Edit</button>
                </div>
              </div>

              <!-- PAGE EDITOR -->
              <div class="element-control">
                <div class="element-header">
                  <span class="element-toggle">
                    <span>Pages</span>
                  </span>
                  <button class="btn-edit" (click)="editElement('pages')">Edit</button>
                </div>
              </div>
            </div>

            <!-- EDIT PANEL -->
            <div class="edit-panel" *ngIf="editingElement">
              <h4>{{ getElementLabel(editingElement) }}</h4>
              <div class="edit-fields">
                <label *ngIf="editingElement === 'logo'">
                  Logo Text
                  <input type="text" [(ngModel)]="sections.logo.label" placeholder="Store name" />
                </label>

                <div *ngIf="editingElement === 'topNav'">
                  <p>Select pages to show in the top navigation. Selected items use the page slug route below.</p>
                  <label class="checkbox-item" *ngFor="let page of availablePages">
                    <input type="checkbox" [checked]="isInTopNav(page.id)" (change)="toggleTopNavPage(page.id)" />
                    <span>{{ page.title }} <small class="route-text">{{ getPageRoute(page) }}</small></span>
                  </label>
                  <p class="info-text">Selected top nav pages will appear next to HOME in the live preview.</p>
                </div>

                <div *ngIf="editingElement === 'secondaryNav'">
                  <p>Secondary nav items can be page links or custom labels.</p>
                  <div class="nav-items-list">
                    <div class="nav-item-row" *ngFor="let item of templateConfig.secondaryNavItems">
                      <input type="text" [(ngModel)]="item.label" placeholder="Nav label" class="input-small" />
                      <select [(ngModel)]="item.url" class="input-small">
                        <option value="">Custom URL</option>
                        <option *ngFor="let page of availablePages" [value]="'/site/' + store.id + '/' + page.slug">
                          {{ page.title }}
                        </option>
                      </select>
                      <input type="number" [(ngModel)]="item.order" class="input-small order-input" min="1" />
                      <button (click)="updateSecondaryNavItem(item)" class="btn-small btn-save">Save</button>
                      <button (click)="removeSecondaryNavItem(item.id)" class="btn-small btn-delete">Delete</button>
                    </div>
                    <button type="button" (click)="addSecondaryNavItem()" class="btn-add-item">+ Add nav item</button>
                  </div>
                </div>

                <label *ngIf="editingElement === 'posts'">
                  Section Title
                  <input type="text" [(ngModel)]="sections.posts.label" placeholder="Recent Posts" />
                </label>

                <div *ngIf="editingElement === 'pages'">
                  <label>
                    Select page to edit
                    <select [(ngModel)]="selectedPageId" (ngModelChange)="selectPage($event)">
                      <option value="">Choose a page</option>
                      <option *ngFor="let page of availablePages" [value]="page.id">{{ page.title }}</option>
                    </select>
                  </label>

                  <div *ngIf="selectedPage">
                    <label>
                      Title
                      <input type="text" [(ngModel)]="pageEditor.title" />
                    </label>
                    <label>
                      Slug
                      <input type="text" [(ngModel)]="pageEditor.slug" />
                    </label>
                    <label>
                      Excerpt
                      <textarea [(ngModel)]="pageEditor.excerpt"></textarea>
                    </label>
                    <label>
                      Page Content
                      <div class="wysiwyg-editor" contenteditable="true" [innerHTML]="pageEditor.content" (input)="onPageEditorInput($event)"></div>
                    </label>
                    <label class="checkbox-item">
                      <input type="checkbox" [checked]="isInTopNav(selectedPage.id)" (change)="toggleTopNavPage(selectedPage.id)" />
                      <span>Add to Top Navigation</span>
                    </label>
                    <label class="checkbox-item">
                      <input type="checkbox" [checked]="isInSecondaryNav(selectedPage.id)" (change)="toggleSecondaryNavPage(selectedPage.id)" />
                      <span>Add to Secondary Navigation</span>
                    </label>
                    <button type="button" class="btn btn-primary" (click)="savePage()">Save Page</button>
                  </div>
                </div>
              </div>
              <button (click)="editingElement = null" class="btn-close">Done</button>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button (click)="saveTemplate(store.id)" class="btn btn-primary">Save Template</button>
          <button (click)="cancel()" class="btn btn-secondary">Cancel</button>
        </div>
      </div>

      <ng-template #noStore>
        <p>No active store selected.</p>
      </ng-template>
    </section>
  `,
  styles: [
    `.template-designer { padding: 2rem; }`,
    `.designer-container { max-width: 1400px; margin: 0 auto; }`,
    `.designer-layout { display: grid; grid-template-columns: 1fr 350px; gap: 2rem; margin: 2rem 0; }`,
    `.preview-pane { }`,
    `.preview-pane h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; }`,
    `.template-preview { border: 1px solid #ddd; border-radius: 0.5rem; overflow: hidden; background: #f9f9f9; }`,
    `.top-nav { display: flex; gap: 1rem; align-items: center; background: #2b2b2b; padding: 0.5rem 1rem; justify-content: flex-end; }`,
    `.nav-link { color: #fff; text-decoration: none; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }`,
    `.social-link { color: #fff; font-size: 1.25rem; text-decoration: none; font-weight: bold; }`,
    `.logo-section { background: #f5f5f5; padding: 2rem 1rem; text-align: center; }`,
    `.logo-text { margin: 0; font-size: 3rem; font-weight: bold; font-style: italic; color: #d32f2f; }`,
    `.secondary-nav { display: flex; gap: 1rem; align-items: center; background: #1a1a1a; padding: 0.5rem 1rem; }`,
    `.nav-icon { color: #fff; text-decoration: none; font-size: 1.25rem; }`,
    `.search-container { margin-left: auto; display: flex; align-items: center; }`,
    `.search-input { padding: 0.5rem 0.75rem; border: none; border-radius: 0.25rem; width: 180px; }`,
    `.search-icon { color: #fff; margin-left: 0.5rem; cursor: pointer; }`,
    `.update-banner { padding: 1rem; background: #efefef; }`,
    `.update-btn { padding: 0.5rem 1rem; background: #2b2b2b; color: #fff; border: none; cursor: pointer; font-weight: 700; border-radius: 0.25rem; }`,
    `.posts-section { padding: 1rem; background: #fff; }`,
    `.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }`,
    `.section-header h2 { margin: 0; font-size: 1.4rem; font-weight: 700; text-transform: uppercase; color: #1a1a1a; }`,
    `.view-more { color: #d32f2f; text-decoration: none; font-weight: 700; font-size: 0.9rem; }`,
    `.post-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }`,
    `.post-list li { padding: 0.75rem 0; border-bottom: 1px solid #eee; }`,
    `.post-list li.empty { color: #999; font-size: 0.9rem; }`,
    `.post-list a { color: #1a1a1a; text-decoration: none; font-weight: 600; }`,
    `.post-list a:hover { color: #d32f2f; }`,
    `.site-footer { background: #1a1a1a; padding: 2rem 1rem; color: #aaa; text-align: center; font-size: 0.9rem; }`,
    `.site-footer p { margin: 0; }`,
    `.editor-pane { background: #fff; border: 1px solid #ddd; border-radius: 0.5rem; padding: 1.5rem; height: fit-content; }`,
    `.editor-pane h3 { margin-top: 0; font-size: 1rem; font-weight: 600; margin-bottom: 1.5rem; }`,
    `.element-controls { display: grid; gap: 0.75rem; margin-bottom: 1.5rem; }`,
    `.element-control { padding: 0.75rem; border: 1px solid #eee; border-radius: 0.3rem; background: #fafafa; }`,
    `.element-header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }`,
    `.element-toggle { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 500; flex: 1; }`,
    `.element-toggle input { cursor: pointer; }`,
    `.btn-edit { padding: 0.4rem 0.8rem; background: #1d4ed8; color: white; border: none; border-radius: 0.3rem; font-size: 0.8rem; cursor: pointer; font-weight: 600; }`,
    `.btn-edit:hover { background: #1e40af; }`,
    `.edit-panel { background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 0.3rem; padding: 1rem; margin-top: 1rem; }`,
    `.edit-panel h4 { margin-top: 0; font-size: 0.9rem; margin-bottom: 0.75rem; }`,
    `.edit-fields { display: grid; gap: 0.75rem; margin-bottom: 1rem; }`,
    `.edit-fields label { display: block; font-size: 0.9rem; font-weight: 500; }`,
    `.edit-fields input { width: 100%; padding: 0.5rem; border: 1px solid #bfdbfe; border-radius: 0.3rem; margin-top: 0.25rem; }`,
    `.btn-close { padding: 0.5rem 1rem; background: #6b7280; color: white; border: none; border-radius: 0.3rem; cursor: pointer; font-size: 0.9rem; width: 100%; }`,
    `.btn-close:hover { background: #4b5563; }`,
    `.action-buttons { display: flex; gap: 1rem; margin-top: 2rem; }`,
    `.btn { padding: 0.75rem 1.5rem; border: none; border-radius: 0.4rem; font-weight: 600; cursor: pointer; }`,
    `.btn-primary { background: #1d4ed8; color: white; }`,
    `.btn-primary:hover { background: #1e40af; }`,
    `.btn-secondary { background: #e5e7eb; color: #374151; }`,
    `.btn-secondary:hover { background: #d1d5db; }`,
    `@media (max-width: 1024px) { .designer-layout { grid-template-columns: 1fr; } .editor-pane { height: auto; } }`
  ]
})
export class TemplateDesignerComponent implements OnInit {
  readonly cms = inject(CmsService);
  private router = inject(Router);

  samplePosts: Post[] = [];
  editingElement: string | null = null;
  selectedPage: Page | null = null;
  selectedPageId: string | null = null;
  pageEditor = {
    title: '',
    slug: '',
    excerpt: '',
    content: ''
  };

  sections = {
    topNav: { enabled: true, label: 'Top Navigation' },
    logo: { enabled: true, label: 'Store Name' },
    secondaryNav: { enabled: true, label: 'Secondary Navigation' },
    updateButton: { enabled: true, label: 'Update Button' },
    posts: { enabled: true, label: 'RECENT POSTS' },
    footer: { enabled: true, label: 'Footer' }
  };

  templateConfig: TemplateConfig = {
    topNavPageIds: [],
    secondaryNavItems: [],
    sidebarPageIds: []
  };

  get topNavPages(): Page[] {
    return this.cms.storePagesSignal().filter((page) => this.templateConfig.topNavPageIds?.includes(page.id));
  }

  get availablePages(): Page[] {
    return this.cms.storePagesSignal();
  }

  ngOnInit() {
    this.loadTemplate();
  }

  async loadTemplate() {
    const store = this.cms.activeStoreSignal();
    if (!store) return;

    this.samplePosts = this.cms.publishedPostsSignal().slice(0, 5);
    const config = store.templateConfig || {};
    this.templateConfig = {
      topNavPageIds: config.topNavPageIds || [],
      secondaryNavItems: config.secondaryNavItems || [],
      sidebarPageIds: config.sidebarPageIds || []
    };
  }

  editElement(element: string) {
    this.editingElement = element;
  }

  getElementLabel(element: string): string {
    const labels: Record<string, string> = {
      topNav: 'Top Navigation',
      logo: 'Logo Section',
      secondaryNav: 'Secondary Navigation',
      updateButton: 'Update Button',
      posts: 'Posts Section',
      footer: 'Footer',
      pages: 'Pages'
    };
    return labels[element] || element;
  }

  isInTopNav(pageId: string): boolean {
    return this.templateConfig.topNavPageIds?.includes(pageId) || false;
  }

  async toggleTopNavPage(pageId: string): Promise<void> {
    if (!this.templateConfig.topNavPageIds) this.templateConfig.topNavPageIds = [];
    if (this.templateConfig.topNavPageIds.includes(pageId)) {
      this.templateConfig.topNavPageIds = this.templateConfig.topNavPageIds.filter((id) => id !== pageId);
    } else {
      this.templateConfig.topNavPageIds = [...this.templateConfig.topNavPageIds, pageId];
    }

    const store = this.cms.activeStoreSignal();
    if (store) {
      try {
        await this.cms.setTemplateConfig(store.id, this.templateConfig);
      } catch (err) {
        console.error('Failed to persist top nav selection', err);
      }
    }
  }

  addSecondaryNavItem(): void {
    const item: NavigationItem = {
      id: `nav-${Date.now()}`,
      label: 'New Nav',
      order: this.templateConfig.secondaryNavItems?.length ? this.templateConfig.secondaryNavItems.length + 1 : 1
    };
    this.templateConfig.secondaryNavItems = [...(this.templateConfig.secondaryNavItems || []), item];
  }

  updateSecondaryNavItem(item: NavigationItem): void {
    if (!this.templateConfig.secondaryNavItems) return;
    this.templateConfig.secondaryNavItems = this.templateConfig.secondaryNavItems.map((nav) => (nav.id === item.id ? item : nav));
  }

  removeSecondaryNavItem(itemId: string): void {
    if (!this.templateConfig.secondaryNavItems) return;
    this.templateConfig.secondaryNavItems = this.templateConfig.secondaryNavItems.filter((item) => item.id !== itemId);
  }

  isInSecondaryNav(pageId: string): boolean {
    return !!this.templateConfig.secondaryNavItems?.some((item) => item.url === `/site/${this.cms.activeStoreSignal()?.id}/${this.availablePages.find((page) => page.id === pageId)?.slug}`);
  }

  getPageRoute(page: Page): string {
    const store = this.cms.activeStoreSignal();
    return store ? `/site/${store.id}/${page.slug}` : `/${page.slug}`;
  }

  async toggleSecondaryNavPage(pageId: string): Promise<void> {
    const store = this.cms.activeStoreSignal();
    if (!store) return;

    const page = this.availablePages.find((p) => p.id === pageId);
    if (!page) return;

    const url = `/site/${store.id}/${page.slug}`;
    const existingIndex = this.templateConfig.secondaryNavItems?.findIndex((item) => item.url === url) ?? -1;

    if (!this.templateConfig.secondaryNavItems) {
      this.templateConfig.secondaryNavItems = [];
    }

    if (existingIndex >= 0) {
      this.templateConfig.secondaryNavItems = this.templateConfig.secondaryNavItems.filter((item) => item.url !== url);
    } else {
      this.templateConfig.secondaryNavItems = [
        ...(this.templateConfig.secondaryNavItems || []),
        { id: `nav-${Date.now()}`, label: page.title, url, order: (this.templateConfig.secondaryNavItems?.length ?? 0) + 1 }
      ];
    }

    try {
      await this.cms.setTemplateConfig(store.id, this.templateConfig);
    } catch (err) {
      console.error('Failed to persist secondary nav change', err);
    }
  }

  selectPage(pageId: string): void {
    const page = this.availablePages.find((p) => p.id === pageId);
    if (!page) return;
    this.selectedPage = page;
    this.selectedPageId = pageId;
    this.pageEditor = {
      title: page.title,
      slug: page.slug,
      excerpt: page.excerpt || '',
      content: page.content || ''
    };
  }

  onPageEditorInput(event: Event): void {
    const target = event.target as HTMLElement;
    this.pageEditor.content = target.innerHTML;
  }

  async savePage(): Promise<void> {
    if (!this.selectedPage) return;
    await this.cms.updatePage(this.selectedPage.id, {
      title: this.pageEditor.title,
      slug: this.pageEditor.slug,
      excerpt: this.pageEditor.excerpt,
      content: this.pageEditor.content
    });
    this.loadTemplate();
  }

  async saveTemplate(storeId: string) {
    await this.cms.setTemplateConfig(storeId, this.templateConfig);
    this.router.navigate(['/dashboard', storeId]);
  }

  cancel() {
    const store = this.cms.activeStoreSignal();
    if (store) {
      this.router.navigate(['/dashboard', store.id]);
    }
  }
}
