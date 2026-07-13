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
    <style [innerHTML]="globalThemeCss"></style>
    <section class="site-page">
      <link rel="stylesheet" [attr.href]="themeCssUrl">

      <!-- TOP NAVIGATION -->
      <nav class="top-nav">
        <a [routerLink]="['/site', blog?.id]" class="nav-link">HOME</a>
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

        <!-- POSTS SECTION -->
        <section class="posts-section">
          <div class="section-header">
            <h2>RECENT POSTS</h2>
            <a [routerLink]="['/site', blog?.id]" class="view-more">View More</a>
          </div>

          <!-- ALL POSTS -->
          <ul class="post-list">
            <li *ngFor="let post of publishedPosts">
              <a [routerLink]="['/site', blog?.id, post.slug]">{{ post.title }}</a>
            </li>
            <li *ngIf="publishedPosts.length === 0" class="empty">No posts yet.</li>
          </ul>
        </section>
      </main>

      <!-- FOOTER -->
      <footer class="site-footer">
        <p>© {{ blog?.name }} · Content and layout are styled by your chosen theme and template.</p>
      </footer>
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
    
    `.posts-section { }`,
    `.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }`,
    `.section-header h2 { margin: 0; font-size: var(--heading-size, 1.4rem); font-weight: 700; text-transform: uppercase; color: var(--text-color, #1a1a1a); }`,
    `.view-more { color: var(--accent-color, #d32f2f); text-decoration: none; font-weight: 700; font-size: 0.9rem; }`,
    
    `.post-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }`,
    `.post-list li { padding: 0.75rem 0; border-bottom: 1px solid var(--border-color, #eee); }`,
    `.post-list li.empty { color: var(--muted-color, #999); font-size: 0.9rem; }`,
    `.post-list a { color: var(--text-color, #1a1a1a); text-decoration: none; font-weight: 600; }`,
    `.post-list a:hover { color: var(--accent-color, #d32f2f); }`,
    
    `.site-footer { background: var(--secondary-color, #1a1a1a); padding: 2rem 1rem; color: var(--muted-color, #aaa); text-align: center; font-size: 0.9rem; }`,
    `.site-footer p { margin: 0; }`,
    
    `@media (max-width: 768px) { .secondary-nav { flex-wrap: wrap; } .top-nav { flex-wrap: wrap; } }`
  ]
})
export class DefaultSiteTemplateComponent {
  private readonly cms = inject(CmsService);

  @Input() blog: Blog | null = null;
  @Input() pages: Page[] = [];
  @Input() publishedPosts: Post[] = [];
  @Input() themeCssUrl = '';
  
  globalThemeCss = '';

  constructor() {
    this.loadGlobalThemeCss();
  }

  private async loadGlobalThemeCss(): Promise<void> {
    const settings = await this.cms.getGlobalThemeSettings();
    this.globalThemeCss = this.cms.generateThemeCss(settings);
  }


}
