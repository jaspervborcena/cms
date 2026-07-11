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
        <div class="top-bar">
          <nav class="top-nav">
            <a href="/">Home</a>
            <ng-container *ngFor="let page of primaryMenuPages">
              <a [routerLink]="['/pages', page.slug]">{{ page.title }}</a>
            </ng-container>
          </nav>
        </div>

        <div class="brand-row">
          <div class="brand-content">
            <div class="logo">{{ blog?.name }}</div>
            <p class="tagline">{{ blog?.description || 'A bold restaurant-style blog with rich page navigation.' }}</p>
          </div>
          <button class="btn ghost">Update</button>
        </div>

        <div class="nav-row">
          <div class="home-icon">
            <a [routerLink]="['/site', blog?.id]">🏠</a>
          </div>
          <nav class="main-nav">
            <ng-container *ngFor="let page of secondaryMenuPages">
              <a [routerLink]="['/pages', page.slug]">{{ page.title }}</a>
            </ng-container>
          </nav>
          <div class="search-wrap">
            <input type="search" placeholder="Search" />
          </div>
        </div>
      </header>

      <main class="site-main">
        <section class="announcement-bar">
          <span class="badge">Update</span>
          <p>Latest news, featured stories, and menu updates are highlighted here.</p>
        </section>

        <section class="content-layout">
          <div class="content-left">
            <section class="posts-section">
              <div class="posts-header">
                <h2>Recent posts</h2>
                <a [routerLink]="['/site', blog?.id]" class="view-more">View more</a>
              </div>
              <article class="featured-post" *ngIf="featuredPost">
                <h3>{{ featuredPost.title }}</h3>
                <p>{{ featuredPost.excerpt }}</p>
                <a [routerLink]="['/site', blog?.id, featuredPost.slug]" class="read-more">Read more</a>
              </article>
              <ul class="post-list">
                <li *ngFor="let post of otherPosts">
                  <a [routerLink]="['/site', blog?.id, post.slug]">{{ post.title }}</a>
                </li>
              </ul>
            </section>
          </div>

          <aside class="sidebar-panel">
            <div class="widget">
              <h3>Facebook</h3>
              <a href="https://facebook.com" target="_blank">Visit our Facebook Page</a>
            </div>
            <div class="widget">
              <h3>Categories</h3>
              <p>Pages, posts, and featured content appear here for easy browsing.</p>
            </div>
            <div class="widget">
              <h3>Recent Pages</h3>
              <ul>
                <li *ngFor="let page of pages"><a [routerLink]="['/pages', page.slug]">{{ page.title }}</a></li>
              </ul>
            </div>
          </aside>
        </section>
      </main>

      <footer class="site-footer">
        <p>© {{ blog?.name }} · Built on gameoffortunes.com</p>
      </footer>
    </section>
  `,
  styles: [
    `.site-page { padding: 0; max-width: 1200px; margin: 0 auto; }`,
    `.site-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.5rem 1.5rem 0; border-bottom: 1px solid rgba(15, 23, 42, 0.08); }`,
    `.brand-group { max-width: 560px; }`,
    `.logo { font-size: 1.35rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #111827; }`,
    `.tagline { margin: 0.5rem 0 0; color: #475569; line-height: 1.7; max-width: 540px; }`,
    `.site-nav { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }`,
    `.site-nav a { color: #1d4ed8; text-decoration: none; font-weight: 600; }`,
    `.site-nav a:hover { text-decoration: underline; }`,
    `.hero-panel { display: grid; gap: 1.5rem; align-items: center; padding: 3rem 1.5rem; background: #f8fafc; }`,
    `.eyebrow { margin: 0 0 1rem 0; color: #1d4ed8; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 0.18em; font-weight: 700; }`,
    `.hero-panel h1 { margin: 0 0 1rem 0; font-size: clamp(2.5rem, 4vw, 4.25rem); line-height: 1.05; color: #111827; }`,
    `.hero-copy { margin: 0; max-width: 720px; color: #475569; font-size: 1.05rem; line-height: 1.8; }`,
    `.hero-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.5rem; }`,
    `.btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.9rem 1.4rem; border-radius: 999px; font-weight: 700; text-decoration: none; }`,
    `.primary { background: #111827; color: white; }`,
    `.secondary { background: white; color: #1d4ed8; border: 1px solid #dbeafe; }`,
    `.content-columns { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; padding: 0 1.5rem; margin-top: 1rem; }`,
    `.featured-section { background: white; padding: 1.75rem; border-radius: 1.25rem; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06); }`,
    `.section-head { display: flex; flex-direction: column; gap: 0.5rem; }`,
    `.section-label { text-transform: uppercase; color: #2563eb; font-size: 0.75rem; letter-spacing: 0.2em; font-weight: 700; }`,
    `.featured-section h2 { margin: 0; font-size: 2rem; color: #111827; }`,
    `.section-copy { margin: 1rem 0 0; color: #475569; line-height: 1.75; }`,
    `.read-more { display: inline-flex; margin-top: 1.5rem; color: #1d4ed8; font-weight: 700; text-decoration: none; }`,
    `.sidebar-panel { display: grid; gap: 1.5rem; }`,
    `.widget { background: white; padding: 1.25rem 1.5rem; border-radius: 1rem; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06); }`,
    `.widget h3 { margin: 0 0 0.75rem 0; font-size: 1rem; }`,
    `.widget a { color: #1d4ed8; text-decoration: none; }`,
    `.widget p { margin: 0; color: #475569; }`,
    `.widget ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.65rem; }`,
    `.widget li a { color: #111827; text-decoration: none; }`,
    `.site-footer { padding: 2rem 1.5rem; color: #6b7280; text-align: center; background: #f8fafc; }`,
    `@media (max-width: 960px) { .content-layout { grid-template-columns: 1fr; } .nav-row { flex-direction: column; align-items: stretch; } .search-wrap { width: 100%; } .search-wrap input { width: 100%; } }`,
    `@media (max-width: 720px) { .brand-row, .nav-row { flex-direction: column; align-items: stretch; } .top-nav { justify-content: center; } .site-page { padding: 0; } .site-main { padding: 1rem; } }`
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
