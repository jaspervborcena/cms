import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CmsService } from '../../services/cms.service';
import { Page, Post } from '../../models/cms.models';

@Component({
  selector: 'app-preview-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="site-page" *ngIf="loaded; else loading">
      <link rel="stylesheet" [attr.href]="themeCssUrl">

      <nav class="top-nav">
        <a [href]="homeLink" class="nav-link">HOME</a>
        <ng-container *ngIf="topNavPages.length">
          <a *ngFor="let page of topNavPages" [href]="pageUrl(page.slug)" class="nav-link">{{ page.title }}</a>
        </ng-container>
        <a href="https://facebook.com" target="_blank" rel="noopener" class="social-link">f</a>
      </nav>

      <div class="logo-section">
        <div class="logo-container">
          <p class="logo-text" [style.color]="blog?.templateConfig?.logoColor || '#d32f2f'">
            {{ blog?.templateConfig?.logoText || blog?.name || 'Blog' }}
          </p>
        </div>
      </div>

      <nav class="secondary-nav">
        <a href="#" class="nav-icon">⌂</a>
        <ng-container *ngFor="let item of secondaryNavItems">
          <a [href]="item.url || '#'" class="nav-item">{{ item.label }}</a>
        </ng-container>
        <div class="search-container">
          <input type="search" placeholder="Search" class="search-input" />
          <span class="search-icon">🔍</span>
        </div>
      </nav>

      <main class="site-main">
        <div class="preview-banner">
          <p class="preview-label">Private preview</p>
          <div class="preview-actions">
            <a [href]="editorLink" class="ghost-btn">Back to editor</a>
            <a *ngIf="blog" [href]="service.getPublicSiteUrl(blog)" target="_blank" class="btn">Publish</a>
          </div>
        </div>

        <article class="post-detail" *ngIf="post">
          <h1>{{ post.title }}</h1>
          <p class="meta">{{ post.category }} · {{ post.publishedAt ? (post.publishedAt | date:'mediumDate') : 'Draft preview' }}</p>
          <div class="content" [innerHTML]="post.content"></div>
        </article>
      </main>

      <footer class="site-footer">
        <p>© {{ blog?.name }} · Content and layout are styled by your chosen theme and template.</p>
      </footer>
    </section>

    <ng-template #loading>
      <p>Loading preview…</p>
    </ng-template>
  `,
  styles: [
    `.site-page { margin: 0; padding: 0; min-height: 100vh; font-family: var(--font-family, Arial, sans-serif); background: var(--bg-color, #f5f5f5); color: var(--text-color, #1a1a1a); }`,
    `.top-nav { display: flex; gap: 1rem; align-items: center; background: var(--secondary-color, #2b2b2b); padding: 1rem; justify-content: flex-end; }`,
    `.nav-link, .nav-item, .social-link { color: #fff; text-decoration: none; font-size: 0.75rem; font-weight: 600; }`,
    `.nav-link:hover, .nav-item:hover { text-decoration: underline; }`,
    `.social-link { font-size: 1.25rem; font-weight: bold; }`,
    `.logo-section { background: var(--bg-color, #f5f5f5); padding: 2rem 1rem; text-align: center; }`,
    `.logo-text { margin: 0; font-size: 3rem; font-weight: bold; font-style: italic; color: var(--primary-color, #d32f2f); }`,
    `.secondary-nav { display: flex; gap: 1rem; align-items: center; background: var(--secondary-color, #1a1a1a); padding: 1rem; }`,
    `.nav-icon { color: #fff; font-size: 1.25rem; }`,
    `.search-container { margin-left: auto; display: flex; align-items: center; }`,
    `.search-input { padding: 0.5rem 0.75rem; border: none; border-radius: 0.25rem; width: 180px; }`,
    `.search-icon { color: #fff; margin-left: 0.5rem; cursor: pointer; }`,
    `.site-main { padding: 1rem; background: #fff; }`,
    `.preview-banner { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }`,
    `.preview-label { margin: 0; font-size: 0.85rem; letter-spacing: 0.16em; text-transform: uppercase; color: #2563eb; }`,
    `.preview-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }`,
    `.ghost-btn, .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.85rem 1rem; border-radius: 0.75rem; font-weight: 700; text-decoration: none; }`,
    `.ghost-btn { background: #f8fafc; border: 1px solid #cbd5e1; color: #1d4ed8; }`,
    `.ghost-btn:hover { background: #eff6ff; }`,
    `.btn { background: #1d4ed8; color: #fff; border: none; }`,
    `.btn:hover { background: #2563eb; }`,
    `.post-detail { background: #fff; padding: 1.75rem; border-radius: 1rem; box-shadow: 0 1px 4px rgba(15,23,42,0.08); }`,
    `.post-detail h1 { margin: 0 0 1rem 0; font-size: 2rem; }`,
    `.meta { color: #6b7280; margin-bottom: 1rem; }`,
    `.content { color: #111827; line-height: 1.75; }`,
    `.content img { max-width: 100%; height: auto; border-radius: 0.75rem; }`,
    `.site-footer { background: var(--secondary-color, #1a1a1a); padding: 2rem 1rem; color: var(--muted-color, #aaa); text-align: center; font-size: 0.9rem; }`,
    `.site-footer p { margin: 0; }`,
    `@media (max-width: 768px) { .top-nav, .secondary-nav, .preview-banner { flex-wrap: wrap; } .site-main { padding: 0.75rem; } }`
  ]
})
export class PreviewPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly service = inject(CmsService);
  post: Post | null = null;
  blog: any = null;
  themeCssUrl = '';
  pages: Page[] = [];
  homeLink = '#';
  editorLink = '#';
  loaded = false;

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    const blogId = params.get('blogId');
    const postId = params.get('postId');

    if (!blogId || !postId) {
      this.loaded = true;
      return;
    }

    this.blog = this.service.blogsSignal().find((b) => b.id === blogId) ?? null;
    this.themeCssUrl = this.service.getThemeCssUrl(this.blog?.theme);
    this.homeLink = this.blog ? `/site/${blogId}` : '/';
    this.editorLink = `/posts/edit/${postId}`;
    this.pages = this.service.pagesSignal().filter((page) => page.blogId === blogId);

    this.service.loadPreviewPost(blogId, postId).then(async (loaded) => {
      if (!loaded) {
        this.loaded = true;
        return;
      }

      const hydrated = await this.service.loadPostById(blogId, loaded.id);
      this.post = hydrated ?? loaded;
      this.loaded = true;
    });
  }

  get topNavPages(): Page[] {
    if (!this.blog?.templateConfig?.topNavPageIds || !this.pages) return [];
    return this.blog.templateConfig.topNavPageIds
      .map((id: string) => this.pages.find((p: Page) => p.id === id))
      .filter((p): p is Page => !!p);
  }

  get secondaryNavItems() {
    return this.blog?.templateConfig?.secondaryNavItems || [];
  }

  pageUrl(slug: string): string {
    return `/site/${this.blog?.id}/${slug}`;
  }
}
