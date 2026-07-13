import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Blog, Page, Post } from '../../models/cms.models';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-default-site-template',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="site-page">
      <link rel="stylesheet" [attr.href]="themeCssUrl">

      <!-- TOP NAVIGATION -->
      <nav class="top-nav">
        <a [routerLink]="['/site', blog?.id]" class="nav-link">Home</a>
        <ng-container *ngFor="let pageId of blog?.templateConfig?.topNavPageIds">
          <a [routerLink]="['/pages', getPageSlug(pageId)]" class="nav-link">{{ getPageTitle(pageId) | uppercase }}</a>
        </ng-container>
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

      <!-- SECONDARY NAVIGATION BAR -->
      <nav class="secondary-nav">
        <a href="#" class="nav-icon">⌂</a>
        <a href="#" class="nav-item" *ngFor="let item of sortedSecondaryNav">{{ item.label | uppercase }}</a>
        <div class="search-container">
          <input type="search" placeholder="" class="search-input" />
          <span class="search-icon">🔍</span>
        </div>
      </nav>

      <!-- MAIN CONTENT -->
      <main class="site-main">
        <!-- UPDATE BUTTON -->
        <div class="update-banner">
          <button class="update-btn">Update</button>
        </div>

        <!-- CONTENT GRID -->
        <div class="content-grid" [class.sidebar-hidden]="!hasSidebarPages">
          <!-- POSTS SECTION -->
          <section class="posts-section">
            <div class="section-header">
              <h2>Recent Posts</h2>
              <a [routerLink]="['/site', blog?.id]" class="view-more">View More</a>
            </div>

            <!-- FEATURED POST -->
            <article class="featured-post" *ngIf="featuredPost">
              <h3>{{ featuredPost.title }}</h3>
              <p class="post-meta">
                <span class="author">{{ blog?.category || 'Author' }}</span>
                <span class="date">{{ featuredPost.publishedAt | date: 'y MMMM d' }}</span>
              </p>
              <p class="excerpt">{{ featuredPost.excerpt }}</p>
              <a [routerLink]="['/site', blog?.id, featuredPost.slug]" class="read-more-btn">Read More »</a>
            </article>

            <!-- OTHER POSTS LIST -->
            <ul class="post-list">
              <li *ngFor="let post of otherPosts">
                <a [routerLink]="['/site', blog?.id, post.slug]">{{ post.title }}</a>
              </li>
              <li *ngIf="otherPosts.length === 0 && !featuredPost" class="empty">No posts yet.</li>
            </ul>
          </section>

          <!-- SIDEBAR -->
          <aside class="sidebar-panel" *ngIf="hasSidebarPages">
            <div class="sidebar-widget" *ngFor="let pageId of blog?.templateConfig?.sidebarPageIds">
              <h3 class="widget-title">{{ getPageTitle(pageId) }}</h3>
              <div class="widget-content">{{ getPageContent(pageId) | slice: 0:150 }}...</div>
            </div>
          </aside>
        </div>
      </main>

      <!-- FOOTER -->
      <footer class="site-footer">
        <p>© {{ blog?.name || 'Blog' }} · Content and layout are styled by your chosen theme and template.</p>
      </footer>
    </section>
  `,
  styles: [
    `.site-page { margin: 0; padding: 0; min-height: 100vh; font-family: Arial, system-ui, sans-serif; }`,
    
    `.top-nav { display: flex; gap: 1.5rem; align-items: center; background: #2b2b2b; padding: 0.75rem 1rem; justify-content: flex-end; }`,
    `.nav-link { color: #fff; text-decoration: none; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }`,
    `.nav-link:hover { text-decoration: underline; }`,
    `.social-link { color: #fff; font-size: 1.25rem; text-decoration: none; font-weight: bold; }`,
    
    `.logo-section { background: #f5f5f5; padding: 2rem 1rem; text-align: center; }`,
    `.logo-container { display: flex; justify-content: center; }`,
    `.logo-text { margin: 0; font-size: 3rem; font-weight: bold; font-style: italic; }`,
    
    `.secondary-nav { display: flex; gap: 1.5rem; align-items: center; background: #1a1a1a; padding: 0.75rem 1rem; }`,
    `.nav-icon { color: #fff; text-decoration: none; font-size: 1.25rem; }`,
    `.nav-item { color: #fff; text-decoration: none; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }`,
    `.nav-item:hover { color: #d32f2f; }`,
    `.search-container { margin-left: auto; display: flex; align-items: center; }`,
    `.search-input { padding: 0.5rem 0.75rem; border: none; border-radius: 0.25rem; width: 180px; }`,
    `.search-icon { color: #fff; margin-left: 0.5rem; cursor: pointer; }`,
    
    `.site-main { padding: 0; }`,
    `.update-banner { padding: 1rem; background: #efefef; }`,
    `.update-btn { padding: 0.5rem 1rem; background: #2b2b2b; color: #fff; border: none; cursor: pointer; font-weight: 700; border-radius: 0.25rem; }`,
    
    `.content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; padding: 1.5rem; background: #fff; }`,
    `.content-grid.sidebar-hidden { grid-template-columns: 1fr; }`,
    
    `.posts-section { }`,
    `.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }`,
    `.section-header h2 { margin: 0; font-size: 1.4rem; font-weight: 700; text-transform: uppercase; color: #1a1a1a; }`,
    `.view-more { color: #d32f2f; text-decoration: none; font-weight: 700; font-size: 0.9rem; }`,
    
    `.featured-post { margin-bottom: 2rem; }`,
    `.featured-post h3 { margin: 0 0 0.75rem 0; font-size: 1.5rem; color: #1a1a1a; }`,
    `.post-meta { font-size: 0.85rem; color: #888; margin: 0 0 0.75rem 0; }`,
    `.post-meta .author { font-weight: 600; }`,
    `.post-meta .date { margin-left: 1rem; }`,
    `.excerpt { color: #666; line-height: 1.6; margin: 0 0 1rem 0; }`,
    `.read-more-btn { display: inline-block; background: #d32f2f; color: #fff; padding: 0.5rem 1rem; text-decoration: none; font-weight: 700; border-radius: 0.25rem; }`,
    `.read-more-btn:hover { background: #b71c1c; }`,
    
    `.post-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }`,
    `.post-list li { padding: 0.75rem; border-bottom: 1px solid #eee; }`,
    `.post-list li.empty { color: #999; font-size: 0.9rem; }`,
    `.post-list a { color: #1a1a1a; text-decoration: none; font-weight: 600; }`,
    `.post-list a:hover { color: #d32f2f; }`,
    
    `.sidebar-panel { display: grid; gap: 1.5rem; }`,
    `.sidebar-widget { background: #1a1a1a; padding: 1rem; border-radius: 0.25rem; }`,
    `.widget-title { margin: 0 0 0.75rem 0; color: #fff; font-size: 0.9rem; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #d32f2f; padding-bottom: 0.5rem; }`,
    `.widget-content { color: #aaa; font-size: 0.9rem; line-height: 1.5; }`,
    
    `.site-footer { background: #1a1a1a; padding: 2rem 1rem; color: #aaa; text-align: center; font-size: 0.9rem; }`,
    `.site-footer p { margin: 0; }`,
    
    `@media (max-width: 768px) { .content-grid { grid-template-columns: 1fr; } .secondary-nav { flex-wrap: wrap; } .top-nav { flex-wrap: wrap; } }`
  ]
})
export class DefaultSiteTemplateComponent {
  private readonly cms = inject(CmsService);

  @Input() blog: Blog | null = null;
  @Input() pages: Page[] = [];
  @Input() publishedPosts: Post[] = [];
  @Input() themeCssUrl = '';

  get sortedSecondaryNav() {
    const items = this.blog?.templateConfig?.secondaryNavItems || [];
    return [...items].sort((a, b) => a.order - b.order);
  }

  get hasSidebarPages(): boolean {
    return (this.blog?.templateConfig?.sidebarPageIds?.length || 0) > 0;
  }

  get featuredPost(): Post | null {
    return this.publishedPosts.length > 0 ? this.publishedPosts[0] : null;
  }

  get otherPosts(): Post[] {
    return this.publishedPosts.length > 1 ? this.publishedPosts.slice(1) : [];
  }

  getPageTitle(pageId: string): string {
    return this.pages.find((p) => p.id === pageId)?.title || pageId;
  }

  getPageSlug(pageId: string): string {
    return this.pages.find((p) => p.id === pageId)?.slug || pageId;
  }

  getPageContent(pageId: string): string {
    return this.pages.find((p) => p.id === pageId)?.content || '';
  }
}
