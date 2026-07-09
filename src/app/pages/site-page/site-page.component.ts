import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-site-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="site-page">
      <div *ngIf="blog; else missing">
        <header class="site-header">
          <div class="brand">{{ blog.name }}</div>
          <nav class="site-nav">
            <a [routerLink]="['/site', blog.id]">Home</a>
            <a [routerLink]="['/site', blog.id]" fragment="posts">Posts</a>
            <a [routerLink]="['/site', blog.id]" fragment="about">About</a>
          </nav>
        </header>

        <main class="site-main">
          <section class="site-content">
            <h2>Published posts</h2>
            <div class="post-grid">
              <article class="card" *ngFor="let post of publishedPosts">
                <h3>{{ post.title }}</h3>
                <p>{{ post.excerpt }}</p>
                <a [routerLink]="['/posts', post.slug]">Read more</a>
              </article>
            </div>
          </section>

          <aside class="site-sidebar">
            <section>
              <h3>Recent posts</h3>
              <ul>
                <li *ngFor="let item of service.recentPostsSignal()">{{ item.title }}</li>
              </ul>
            </section>
            <section>
              <h3>Popular posts</h3>
              <ul>
                <li *ngFor="let item of service.popularPostsSignal()">{{ item.title }}</li>
              </ul>
            </section>
          </aside>
        </main>
      </div>

      <ng-template #missing>
        <p>Blog not found.</p>
      </ng-template>
    </section>
  `,
  styles: [
    `.site-page { padding:1.5rem; }`,
    `.site-header { display:flex; justify-content:space-between; align-items:center; padding:1rem 0; border-bottom:1px solid #e5e7eb; }`,
    `.site-nav a { margin-left:0.75rem; color:#1d4ed8; text-decoration:none; }`,
    `.site-main { display:grid; grid-template-columns:2fr 1fr; gap:2rem; margin-top:1.5rem; }`,
    `.post-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1rem; }`,
    `.card { background:white; padding:1.25rem; border-radius:1rem; box-shadow:0 1px 3px rgba(15,23,42,0.06); }`,
    `.card h3 { margin-top:0; }`,
    `.site-sidebar section { background:#f8fafc; padding:1rem; border-radius:0.85rem; margin-bottom:1rem; }`,
    `.site-sidebar h3 { margin-top:0; margin-bottom:0.75rem; font-size:0.95rem; color:#374151; }`,
    `.site-sidebar ul { list-style:none; padding:0; margin:0; }`,
    `.site-sidebar li { padding:0.25rem 0; color:#1f2937; font-size:0.95rem; }
  `]
})
export class SitePageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly service = inject(CmsService);
  publishedPosts = [] as any[];
  blog: any = null;

  constructor() {
    const blogId = this.route.snapshot.paramMap.get('blogId');
    if (!blogId) return;

    this.blog = this.service.blogsSignal().find((b) => b.id === blogId) ?? null;
    this.publishedPosts = this.service.postsSignal().filter((post) => post.blogId === blogId && post.status === 'published');
  }
}
