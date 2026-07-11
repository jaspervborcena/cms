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

      <header class="site-header">
        <nav class="primary-nav">
          <a [routerLink]="['/site', blog?.id]" class="nav-link">Home</a>
          <ng-container *ngFor="let page of primaryMenuPages">
            <a [routerLink]="['/pages', page.slug]" class="nav-link">{{ page.title }}</a>
          </ng-container>
        </nav>

        <div class="brand-hero">
          <p class="hero-label">PLAY</p>
          <p class="hero-title">{{ blog?.name || 'play' }}</p>
        </div>

        <div class="hero-action-row">
          <button class="btn action-btn">Update</button>
          <div class="search-wrap">
            <input type="search" placeholder="Search" />
          </div>
        </div>
      </header>

      <main class="site-main">
        <section class="announcement-card">
          <h2>Update</h2>
          <p>Latest news, featured stories, and menu updates are highlighted here.</p>
        </section>

        <section class="content-grid">
          <section class="recent-section">
            <div class="recent-header">
              <h2>Recent posts</h2>
              <a [routerLink]="['/site', blog?.id]" class="view-more">View more</a>
            </div>

            <article class="featured-card" *ngIf="featuredPost">
              <h3>{{ featuredPost.title }}</h3>
              <p>{{ featuredPost.excerpt }}</p>
              <a [routerLink]="['/site', blog?.id, featuredPost.slug]" class="read-more">Read more</a>
            </article>

            <ul class="post-list">
              <li *ngFor="let post of otherPosts">
                <a [routerLink]="['/site', blog?.id, post.slug]">{{ post.title }}</a>
              </li>
              <li *ngIf="otherPosts.length === 0" class="empty-state">No additional posts yet.</li>
            </ul>
          </section>

          <aside class="sidebar-panel">
            <div class="widget">
              <h3>Facebook</h3>
              <a href="https://facebook.com" target="_blank" rel="noopener">Visit our Facebook Page</a>
            </div>
            <div class="widget">
              <h3>Categories</h3>
              <p>Pages, posts, and featured content appear here for easy browsing.</p>
            </div>
            <div class="widget">
              <h3>Recent Pages</h3>
              <ul>
                <li *ngFor="let page of pages">
                  <a [routerLink]="['/pages', page.slug]">{{ page.title }}</a>
                </li>
                <li *ngIf="pages.length === 0">No pages yet.</li>
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </section>
  `,
  styles: [
    `.site-page { padding: 0; max-width: 1200px; margin: 0 auto; background: #f4f6fb; min-height: 100vh; font-family: Inter, system-ui, sans-serif; }`,
    `.site-header { display: grid; grid-template-columns: 1fr minmax(320px, 1.5fr) minmax(260px, 1fr); gap: 1rem; align-items: center; padding: 1.75rem 1.5rem 0; }`,
    `.primary-nav { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }`,
    `.nav-link { color: #1d4ed8; text-decoration: none; font-weight: 700; font-size: 0.95rem; }`,
    `.nav-link:hover { text-decoration: underline; }`,
    `.brand-hero { text-align: center; }`,
    `.hero-label { margin: 0; font-size: 0.75rem; letter-spacing: 0.35em; text-transform: uppercase; color: #1d4ed8; }`,
    `.hero-title { margin: 0.4rem 0 0; font-size: clamp(2.5rem, 4vw, 4.5rem); line-height: 1; font-weight: 900; color: #111827; }`,
    `.hero-action-row { display: flex; align-items: center; justify-content: flex-end; gap: 1rem; }`,
    `.btn { border: none; border-radius: 999px; font-weight: 700; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; }`,
    `.action-btn { padding: 0.95rem 1.8rem; background: white; color: #111827; border: 1px solid #111827; box-shadow: 0 10px 30px rgba(17, 24, 39, 0.08); }`,
    `.action-btn:hover { transform: translateY(-1px); box-shadow: 0 14px 40px rgba(17, 24, 39, 0.12); }`,
    `.search-wrap { display: flex; align-items: center; justify-content: flex-end; }`,
    `.search-wrap input { width: 100%; max-width: 220px; padding: 0.85rem 1rem; border-radius: 999px; border: 1px solid #cbd5e1; background: white; color: #111827; }`,
    `.site-main { padding: 1.5rem; }`,
    `.announcement-card { background: white; padding: 1.5rem 1.75rem; border-radius: 1.25rem; box-shadow: 0 14px 40px rgba(15, 23, 42, 0.06); border: 1px solid rgba(15, 23, 42, 0.06); margin-bottom: 1.5rem; }`,
    `.announcement-card h2 { margin: 0 0 0.75rem 0; font-size: 1.4rem; }`,
    `.announcement-card p { margin: 0; color: #475569; line-height: 1.8; }`,
    `.content-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); gap: 1.5rem; }`,
    `.recent-section { display: grid; gap: 1.25rem; }`,
    `.recent-header { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }`,
    `.recent-header h2 { margin: 0; font-size: 1.5rem; }`,
    `.view-more { color: #1d4ed8; text-decoration: none; font-weight: 700; }`,
    `.view-more:hover { text-decoration: underline; }`,
    `.featured-card { background: white; padding: 1.5rem; border-radius: 1.25rem; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06); }`,
    `.featured-card h3 { margin: 0 0 0.85rem 0; font-size: 1.35rem; }`,
    `.featured-card p { margin: 0; color: #475569; line-height: 1.8; }`,
    `.post-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.85rem; }`,
    `.post-list li { background: white; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 1rem 1.15rem; }`,
    `.post-list a { color: #111827; text-decoration: none; font-weight: 700; }`,
    `.post-list a:hover { text-decoration: underline; }`,
    `.empty-state { color: #6b7280; padding: 1rem; border-radius: 1rem; background: #f8fafc; border: 1px solid #e2e8f0; }`,
    `.sidebar-panel { display: grid; gap: 1rem; }`,
    `.widget { background: white; padding: 1.25rem 1.5rem; border-radius: 1rem; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06); border: 1px solid rgba(15, 23, 42, 0.08); }`,
    `.widget h3 { margin: 0 0 0.75rem 0; font-size: 1rem; }`,
    `.widget a { color: #1d4ed8; text-decoration: none; }`,
    `.widget a:hover { text-decoration: underline; }`,
    `.widget p { margin: 0; color: #475569; line-height: 1.75; }`,
    `.widget ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem; }`,
    `.widget li { margin: 0; }`,
    `@media (max-width: 980px) { .site-header { grid-template-columns: 1fr; text-align: center; } .hero-action-row { justify-content: center; } .search-wrap { justify-content: center; } .content-grid { grid-template-columns: 1fr; } }`,
    `@media (max-width: 640px) { .primary-nav { justify-content: center; } .hero-action-row { flex-direction: column; gap: 0.75rem; } .search-wrap input { max-width: 100%; } }`
  ]
})
export class DefaultSiteTemplateComponent {
  private readonly cms = inject(CmsService);

  @Input() blog: Blog | null = null;
  @Input() pages: Page[] = [];
  @Input() publishedPosts: Post[] = [];
  @Input() themeCssUrl = '';

  get primaryMenuPages(): Page[] {
    return this.cms.getPrimaryMenuPages(this.pages);
  }

  get secondaryMenuPages(): Page[] {
    return this.cms.getSecondaryMenuPages(this.pages);
  }

  get featuredPost(): Post | null {
    return this.publishedPosts.length > 0 ? this.publishedPosts[0] : null;
  }

  get otherPosts(): Post[] {
    return this.publishedPosts.length > 1 ? this.publishedPosts.slice(1) : [];
  }
}
