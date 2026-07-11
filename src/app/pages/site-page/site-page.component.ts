import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Page } from '../../models/cms.models';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-site-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="site-page">
      <link rel="stylesheet" [attr.href]="themeCssUrl">
      <div *ngIf="blog; else missing">
        <header class="site-header">
          <div>
            <p class="brand">{{ blog.name }}</p>
            <p class="tagline">{{ blog.description || 'A simple public site for your published posts.' }}</p>
          </div>
          <nav class="site-nav">
            <a [routerLink]="['/site', blog.id]">Home</a>
            <a [routerLink]="['/site', blog.id]" fragment="posts">Posts</a>
            <ng-container *ngFor="let page of primaryMenuPages">
              <a [routerLink]="['/pages', page.slug]">{{ page.title }}</a>
            </ng-container>
          </nav>
          <nav class="secondary-nav" *ngIf="secondaryMenuPages.length > 0">
            <span>More</span>
            <ng-container *ngFor="let page of secondaryMenuPages">
              <a [routerLink]="['/pages', page.slug]">{{ page.title }}</a>
            </ng-container>
          </nav>
        </header>

        <main class="site-main">
          <section class="site-hero">
            <h1>Published posts</h1>
            <p>Everything currently live for {{ blog.name }} is listed here.</p>
          </section>

          <section class="post-grid">
            <article class="card" *ngIf="publishedPosts.length === 0">
              <h3>No published posts yet</h3>
              <p>This site is live but there are no posts published yet.</p>
            </article>
            <article class="card" *ngFor="let post of publishedPosts">
              <h3>{{ post.title }}</h3>
              <p>{{ post.excerpt }}</p>
              <a [routerLink]="['/site', blog.id, post.slug]">Read more</a>
            </article>
          </section>
          <footer class="site-footer">
            <p>© {{ blog.name }} · Content and layout are styled by the selected theme.</p>
          </footer>
        </main>
      </div>

      <ng-template #missing>
        <p>Blog not found.</p>
      </ng-template>
    </section>
  `,
  styles: [
    `.site-page { padding:2rem; max-width:1080px; margin:0 auto; }`,
    `.site-header { display:flex; flex-wrap:wrap; justify-content:space-between; gap:1rem; align-items:flex-end; padding-bottom:1.5rem; border-bottom:1px solid #e2e8f0; }`,
    `.brand { margin:0; font-size:1.75rem; font-weight:800; color:#111827; }`,
    `.tagline { margin:0.5rem 0 0 0; color:#475569; max-width:640px; }`,
    `.site-nav { display:flex; gap:1rem; flex-wrap:wrap; }`,
    `.site-nav a { color:#1d4ed8; text-decoration:none; font-weight:600; }`,
    `.site-nav a:hover { text-decoration:underline; }`,
    `.site-footer { margin-top:2rem; padding-top:1.25rem; border-top:1px solid #e2e8f0; color:#475569; }`,
    `.site-main { margin-top:2rem; }`,
    `.site-hero { margin-bottom:1.75rem; }`,
    `.site-hero h1 { margin:0 0 0.5rem; font-size:2.25rem; line-height:1.05; }`,
    `.site-hero p { margin:0; color:#475569; font-size:1.05rem; }`,
    `.post-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:1.25rem; }`,
    `.card { background:white; padding:1.5rem; border-radius:1rem; box-shadow:0 1px 4px rgba(15,23,42,0.08); }`,
    `.card h3 { margin-top:0; font-size:1.15rem; }`,
    `.card p { color:#475569; margin:0.75rem 0 1rem 0; }`,
    `.card a { color:#1d4ed8; font-weight:700; text-decoration:none; }`,
    `.card a:hover { text-decoration:underline; }
  `]
})
export class SitePageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly service = inject(CmsService);
  pages: Page[] = [];
  publishedPosts = [] as any[];
  blog: any = null;
  themeCssUrl = '';

  get primaryMenuPages(): Page[] {
    return this.service.getPrimaryMenuPages(this.pages);
  }

  get secondaryMenuPages(): Page[] {
    return this.service.getSecondaryMenuPages(this.pages);
  }

  constructor() {
    const blogId = this.route.snapshot.paramMap.get('blogId');
    if (!blogId) return;

    this.blog = this.service.blogsSignal().find((b) => b.id === blogId) ?? null;
    this.pages = this.service.pagesSignal().filter((page) => page.blogId === blogId);
    this.publishedPosts = this.service.postsSignal().filter((post) => post.blogId === blogId && post.status === 'published');
    this.themeCssUrl = this.service.getThemeCssUrl(this.blog?.theme);
  }
}
