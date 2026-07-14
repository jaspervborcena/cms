import { Component, Input, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Blog, Page, Post } from '../../models/cms.models';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-default-site-template',
  standalone: true,
  imports: [CommonModule],
  template: `
    <style [innerHTML]="globalThemeCss"></style>
    <section class="site-page">
      <link rel="stylesheet" [attr.href]="themeCssUrl">

      <!-- TOP NAVIGATION -->
      <nav class="top-nav">
        <a href="/site/{{ blog?.id }}" class="nav-link">HOME</a>
        <ng-container *ngIf="topNavPages.length; else noTopNav">
          <a *ngFor="let p of topNavPages" href="/site/{{ blog?.id }}/{{ p.slug }}" class="nav-link">{{ p.title }}</a>
        </ng-container>
        <ng-template #noTopNav>
          <!-- no additional top nav pages configured -->
        </ng-template>
        <a href="https://facebook.com" target="_blank" rel="noopener" class="social-link">f</a>
      </nav>

      <!-- LOGO SECTION -->
      <div class="logo-section">
        <div class="logo-container">
          <p class="logo-text" [style.color]="blog?.templateConfig?.logoColor || '#d32f2f'">
            {{ blog?.templateConfig?.logoText || blog?.name || 'Blog' }}
          </p>
        </div>
      </div>

      <!-- SEARCH & UPDATE BAR -->
      <nav class="secondary-nav">
        <a href="#" class="nav-icon">⌂</a>
        <ng-container *ngIf="secondaryNavItems?.length">
          <a *ngFor="let item of secondaryNavItems" [attr.href]="item.url || '#'" class="nav-item">{{ item.label }}</a>
        </ng-container>
        <div class="search-container">
          <input type="search" placeholder="" class="search-input" />
          <span class="search-icon">🔍</span>
        </div>
      </nav>

      <!-- MAIN CONTENT -->
      <main class="site-main">

        <!-- CONTENT GRID -->
        <div class="content-grid" [class.sidebar-hidden]="pages.length === 0">
          <!-- POSTS SECTION -->
          <section class="posts-section">
            <div class="section-header">
              <h2 *ngIf="primaryPost; else recentTitle">{{ primaryPost?.title }}</h2>
              <ng-template #recentTitle>
                <h2>RECENT POSTS</h2>
              </ng-template>
            </div>

            <div class="post-list">
              <ng-container *ngIf="primaryPost; else noPosts">
                <article class="post-item featured">
                  <h3 class="post-title">{{ primaryPost.title }}</h3>
                  <p class="post-meta">{{ primaryPost.category }} · {{ primaryPost.publishedAt ? (primaryPost.publishedAt | date:'mediumDate') : 'Draft' }}</p>
                  <div class="post-content" [innerHTML]="primaryPost.content"></div>
                </article>
              </ng-container>

              <ng-template #noPosts>
                <div class="empty">No posts yet.</div>
              </ng-template>
            </div>
          </section>

          <!-- RECENT POSTS / SIDEBAR -->
          <aside class="sidebar-panel">
            <!-- If previewing a single post, show its title in the sidebar -->
            <div class="sidebar-widget" *ngIf="previewPost">
              <h3 class="widget-title">{{ previewPost.title }}</h3>
            </div>

            <!-- List recent published post titles as links -->
            <div class="sidebar-widget" *ngIf="publishedPosts.length > 0">
              <h3 class="widget-title">Recent Posts</h3>
              <ul class="widget-list">
                <li *ngFor="let p of publishedPosts">
                  <a [href]="'/site/' + blog?.id + '/' + p.slug">{{ p.title }}</a>
                </li>
              </ul>
            </div>

            <!-- Fallback when there are no posts and not previewing -->
            <div class="sidebar-widget" *ngIf="!previewPost && publishedPosts.length === 0">
              <h3 class="widget-title">Other Posts</h3>
              <div class="widget-content">No other posts yet.</div>
            </div>
          </aside>
        </div>
      </main>

      <!-- FOOTER -->
      <footer class="site-footer">
        <p>© {{ blog?.name }} · Content and layout are styled by your chosen theme and template.</p>
      </footer>
      <!-- DEBUG PANEL removed for preview/published site -->
    </section>
  `,
  styles: [
    `.site-page { margin: 0; padding: 0; min-height: 100vh; font-family: var(--font-family, Arial, sans-serif); background: var(--bg-color, #f5f5f5); color: var(--text-color, #1a1a1a); }`,
    
    `.top-nav { display: flex; gap: var(--gap, 1rem); align-items: center; background: var(--secondary-color, #2b2b2b); padding: var(--padding, 1rem); justify-content: flex-end; }`,
    `.nav-link { color: #fff; text-decoration: none; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }`,
    `.nav-link:hover { text-decoration: underline; }`,
    `.social-link { color: #fff; font-size: 1.25rem; text-decoration: none; font-weight: bold; }`,
    
    `.logo-section { background: var(--bg-color, #f5f5f5); padding: 2rem 1rem; text-align: center; }`,
    `.logo-container { display: flex; justify-content: center; }`,
    `.logo-text { margin: 0; font-size: 3rem; font-weight: bold; font-style: italic; color: var(--primary-color, #d32f2f); }`,
    
    `.secondary-nav { display: flex; gap: var(--gap, 1rem); align-items: center; background: var(--secondary-color, #1a1a1a); padding: var(--padding, 1rem); }`,
    `.nav-icon { color: #fff; text-decoration: none; font-size: 1.25rem; }`,
    `.search-container { margin-left: auto; display: flex; align-items: center; }`,
    `.search-input { padding: 0.5rem 0.75rem; border: none; border-radius: var(--border-radius, 0.25rem); width: 180px; }`,
    `.search-icon { color: #fff; margin-left: 0.5rem; cursor: pointer; }`,
    
    `.site-main { padding: var(--padding, 1rem); background: #fff; }`,
    `.update-banner { padding: 1rem 0 1.5rem 0; margin-bottom: 1rem; }`,
    `.update-btn { padding: 0.5rem 1rem; background: var(--secondary-color, #2b2b2b); color: #fff; border: none; cursor: pointer; font-weight: 700; border-radius: var(--border-radius, 0.25rem); }`,
    
    `.content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--gap, 1rem); }`,
    `.content-grid.sidebar-hidden { grid-template-columns: 1fr; }`,
    
    `.posts-section { }`,
    `.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }`,
    `.section-header h2 { margin: 0; font-size: var(--heading-size, 1.4rem); font-weight: 700; text-transform: uppercase; color: var(--text-color, #1a1a1a); }`,
    `.view-more { color: var(--accent-color, #d32f2f); text-decoration: none; font-weight: 700; font-size: 0.9rem; }`,
    
    `.post-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }`,
    `.post-list li { padding: 0.75rem 0; border-bottom: 1px solid var(--border-color, #eee); }`,
    `.post-list li.empty { color: var(--muted-color, #999); font-size: 0.9rem; }`,
    `.post-list a { color: var(--text-color, #1a1a1a); text-decoration: none; font-weight: 600; }`,
    `.post-list a:hover { color: var(--accent-color, #d32f2f); }`,
    
    `.sidebar-panel { display: grid; gap: var(--gap, 1rem); }`,
    `.sidebar-widget { background: var(--secondary-color, #1a1a1a); padding: var(--padding, 1rem); border-radius: var(--border-radius, 0.25rem); }`,
    `.widget-title { margin: 0 0 0.75rem 0; color: #fff; font-size: 0.9rem; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid var(--primary-color, #d32f2f); padding-bottom: 0.5rem; }`,
    `.widget-content { color: var(--muted-color, #aaa); font-size: 0.9rem; line-height: 1.5; }`,
    
    `.site-footer { background: var(--secondary-color, #1a1a1a); padding: 2rem 1rem; color: var(--muted-color, #aaa); text-align: center; font-size: 0.9rem; }`,
    `.site-footer p { margin: 0; }`,
    
    `@media (max-width: 768px) { .content-grid { grid-template-columns: 1fr; } .secondary-nav { flex-wrap: wrap; } .top-nav { flex-wrap: wrap; } }`
  ]
})
export class DefaultSiteTemplateComponent implements OnChanges {
  private readonly cms = inject(CmsService);

  @Input() blog: Blog | null = null;
  @Input() pages: Page[] = [];
  @Input() publishedPosts: Post[] = [];
  @Input() previewPost: Post | null = null;
  @Input() themeCssUrl = '';
  
  globalThemeCss = '';

  get topNavPages(): Page[] {
    if (!this.blog?.templateConfig?.topNavPageIds || !this.pages) return [];
    return this.blog.templateConfig.topNavPageIds
      .map((id) => this.pages.find((p) => p.id === id))
      .filter((p): p is Page => !!p);
  }

  get secondaryNavItems() {
    return this.blog?.templateConfig?.secondaryNavItems || [];
  }

  get otherPosts(): Post[] {
    return this.publishedPosts.length > 1 ? this.publishedPosts.slice(1) : [];
  }

  get primaryPost(): Post | null {
    if (this.previewPost) return this.previewPost;
    return this.publishedPosts.length > 0 ? this.publishedPosts[0] : null;
  }

  previewPostLink(): string {
    if (!this.blog?.id || !this.previewPost?.slug) return '#';
    return `/site/${this.blog.id}/${this.previewPost.slug}`;
  }

  constructor() {
    this.loadGlobalThemeCss();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const changeSummary = Object.keys(changes).reduce((summary, key) => {
      const change = changes[key];
      summary[key] = {
        previous: change.previousValue,
        current: change.currentValue,
        firstChange: change.firstChange
      };
      return summary;
    }, {} as Record<string, { previous: unknown; current: unknown; firstChange: boolean }>);

    console.log('templateConfig change detected', {
      templateConfig: this.blog?.templateConfig,
      changeSummary
    });

    if (changes['blog'] && changes['blog'].currentValue?.templateConfig !== changes['blog'].previousValue?.templateConfig) {
      console.log('blog.templateConfig changed', {
        previous: changes['blog'].previousValue?.templateConfig,
        current: changes['blog'].currentValue?.templateConfig
      });
    }
  }

  // Temporary debug helper rendered on the public page to inspect live data
  debugJson(): any {
    return {
      templateConfig: this.blog?.templateConfig || {},
      pages: this.pages || [],
      publishedPosts: this.publishedPosts || []
    };
  }

  private async loadGlobalThemeCss(): Promise<void> {
    const settings = await this.cms.getGlobalThemeSettings();
    this.globalThemeCss = this.cms.generateThemeCss(settings);
  }


}
