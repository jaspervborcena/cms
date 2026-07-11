import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Blog, Page, Post } from '../../models/cms.models';

@Component({
  selector: 'app-default-site-template',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="site-page">
      <link rel="stylesheet" [attr.href]="themeCssUrl">

      <header class="site-header">
        <div>
          <p class="brand">{{ blog?.name }}</p>
          <p class="tagline">{{ blog?.description || 'A simple public site for your published posts.' }}</p>
        </div>
        <nav class="site-nav">
          <a href="/">Home</a>
          <a [routerLink]="['/site', blog?.id]" fragment="posts">Posts</a>
          <ng-container *ngFor="let page of pages">
            <a [routerLink]="['/pages', page.slug]">{{ page.title }}</a>
          </ng-container>
        </nav>
      </header>

      <main class="site-main">
        <section class="site-hero">
          <div class="hero-copy">
            <p class="eyebrow">{{ blog?.name }}</p>
            <h1>{{ blog?.description || 'Create content that connects with your audience.' }}</h1>
            <p class="lead">A clean, theme-driven blog powered by your CMS. Publish posts, preview pages, and share your brand with a custom subdomain.</p>
          </div>
        </section>

        <section class="post-grid" id="posts">
          <article class="card" *ngIf="publishedPosts.length === 0">
            <h3>No published posts yet</h3>
            <p>Add your first post to make this blog live.</p>
          </article>
          <article class="card" *ngFor="let post of publishedPosts">
            <span class="tag">{{ post.category }}</span>
            <h3>{{ post.title }}</h3>
            <p>{{ post.excerpt }}</p>
            <a [routerLink]="['/site', blog?.id, post.slug]">Read more</a>
          </article>
        </section>
      </main>

      <footer class="site-footer">
        <p>© {{ blog?.name }} · Built on gameoffortunes.com</p>
      </footer>
    </section>
  `,
  styles: [
    `.site-page { padding: 2rem; max-width: 1080px; margin: 0 auto; }`,
    `.site-header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; align-items: flex-end; padding-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; }`,
    `.brand { margin: 0; font-size: 1.75rem; font-weight: 800; color: #111827; }`,
    `.tagline { margin: 0.5rem 0 0 0; color: #475569; max-width: 640px; }`,
    `.site-nav { display: flex; gap: 1rem; flex-wrap: wrap; }`,
    `.site-nav a { color: #1d4ed8; text-decoration: none; font-weight: 600; }`,
    `.site-nav a:hover { text-decoration: underline; }`,
    `.site-main { margin-top: 2rem; }`,
    `.site-hero { padding: 3rem 0; }`,
    `.hero-copy { max-width: 720px; }`,
    `.eyebrow { margin: 0; text-transform: uppercase; letter-spacing: 0.2em; color: #2563eb; font-weight: 700; }`,
    `.site-hero h1 { margin: 1rem 0 0.75rem; font-size: 3rem; line-height: 1.05; }`,
    `.lead { margin: 0; color: #475569; font-size: 1.05rem; line-height: 1.8; }`,
    `.post-grid { display: grid; gap: 1.25rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-top: 2rem; }`,
    `.card { background: white; padding: 1.5rem; border-radius: 1rem; box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }`,
    `.card h3 { margin-top: 0.75rem; font-size: 1.25rem; }`,
    `.card p { color: #475569; margin: 0.75rem 0 1rem; }`,
    `.card a { color: #1d4ed8; font-weight: 700; text-decoration: none; }`,
    `.card a:hover { text-decoration: underline; }`,
    `.tag { display: inline-block; margin-bottom: 0.85rem; padding: 0.35rem 0.8rem; background: #eff6ff; color: #2563eb; font-size: 0.8rem; font-weight: 700; border-radius: 999px; }`,
    `.site-footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; color: #475569; }`,
    `@media (max-width: 720px) { .site-header { flex-direction: column; align-items: stretch; } .site-hero h1 { font-size: 2.2rem; } }
  `]
})
export class DefaultSiteTemplateComponent {
  @Input() blog: Blog | null = null;
  @Input() pages: Page[] = [];
  @Input() publishedPosts: Post[] = [];
  @Input() themeCssUrl = '';
}
