import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-preview-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="preview-page">
      <div *ngIf="post; else loading">
        <header class="site-header">
          <div class="brand">{{ blog?.name || 'Preview Site' }}</div>
          <nav class="site-nav">
            <a [routerLink]="['/site', blog?.id]">Home</a>
            <a [routerLink]="['/site', blog?.id]" fragment="posts">Posts</a>
            <a [routerLink]="['/site', blog?.id]" fragment="about">About</a>
          </nav>
        </header>

        <main class="site-main">
          <article class="post-preview">
            <h1>{{ post.title }}</h1>
            <p class="meta">{{ post.category }} · {{ post.publishedAt | date:'mediumDate' }}</p>
            <p class="excerpt">{{ post.excerpt }}</p>
            <div class="content" [innerHTML]="post.content"></div>
          </article>

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

      <ng-template #loading>
        <p>Loading preview…</p>
      </ng-template>
    </section>
  `,
  styles: [
    `.preview-page { padding:1.5rem; }`,
    `.site-header { display:flex; justify-content:space-between; align-items:center; padding:1rem 0; border-bottom:1px solid #e5e7eb; }`,
    `.site-nav a { margin-left:0.75rem; color:#1d4ed8; text-decoration:none; }`,
    `.site-main { display:grid; grid-template-columns:2fr 1fr; gap:2rem; margin-top:1.5rem; }`,
    `.post-preview { background:white; padding:1.5rem; border-radius:1rem; box-shadow:0 1px 3px rgba(15,23,42,0.06); }`,
    `.meta { color:#6b7280; margin-bottom:1rem; }`,
    `.excerpt { color:#374151; margin-bottom:1.5rem; }`,
    `.site-sidebar section { background:#f8fafc; padding:1rem; border-radius:0.85rem; margin-bottom:1rem; }`,
    `.site-sidebar h3 { margin-top:0; margin-bottom:0.75rem; font-size:0.95rem; color:#374151; }`,
    `.site-sidebar ul { list-style:none; padding:0; margin:0; }`,
    `.site-sidebar li { padding:0.25rem 0; color:#1f2937; font-size:0.95rem; }
  `]
})
export class PreviewPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly service = inject(CmsService);
  post: any = null;
  blog: any = null;

  constructor() {
    const params = this.route.snapshot.paramMap;
    const blogId = params.get('blogId');
    const postId = params.get('postId');

    if (blogId) {
      this.blog = this.service.blogsSignal().find((b) => b.id === blogId) ?? null;
    }

    if (blogId && postId) {
      this.service.loadPreviewPost(blogId, postId).then((loaded) => {
        this.post = loaded;
      });
    }
  }
}
