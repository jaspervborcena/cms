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
      <link rel="stylesheet" [attr.href]="themeCssUrl">
      <div *ngIf="post; else loading">
        <header class="preview-header">
          <div class="preview-title">
            <p class="status-label">Private preview</p>
            <h1>{{ post.title }}</h1>
            <p class="meta">{{ blog?.name || 'Preview site' }} · {{ post.publishedAt ? (post.publishedAt | date:'mediumDate') : 'Draft preview' }}</p>
          </div>

          <div class="preview-actions">
            <a [routerLink]="['/posts', 'edit', post.id]" class="ghost-btn">Back to editor</a>
<a *ngIf="blog" [href]="service.getPublicSiteUrl(blog)" target="_blank" class="btn">Publish</a>
          </div>
        </header>

        <article class="post-preview">
          <p class="category-label">{{ post.category }}</p>
          <p class="excerpt">{{ post.excerpt }}</p>
          <div class="content" [innerHTML]="post.content"></div>
        </article>
      </div>

      <ng-template #loading>
        <p>Loading preview…</p>
      </ng-template>
    </section>
  `,
  styles: [
    `.preview-page { padding:2rem; max-width:980px; margin:0 auto; }`,
    `.preview-header { display:flex; flex-wrap:wrap; justify-content:space-between; gap:1rem; align-items:flex-start; margin-bottom:1.5rem; }`,
    `.preview-title { max-width:calc(100% - 220px); }`,
    `.status-label { margin:0 0 0.5rem 0; font-size:0.85rem; letter-spacing:0.16em; text-transform:uppercase; color:#2563eb; }`,
    `.preview-header h1 { margin:0; font-size:2.25rem; line-height:1.1; }`,
    `.preview-header .meta { margin:0.75rem 0 0; color:#475569; }`,
    `.preview-actions { display:flex; gap:0.75rem; flex-wrap:wrap; }`,
    `.ghost-btn, .btn { display:inline-flex; align-items:center; justify-content:center; padding:0.85rem 1rem; border-radius:0.75rem; font-weight:700; text-decoration:none; }`,
    `.ghost-btn { background:#f8fafc; border:1px solid #cbd5e1; color:#1d4ed8; }`,
    `.ghost-btn:hover { background:#eff6ff; }`,
    `.btn { background:#1d4ed8; color:white; border:none; }`,
    `.btn:hover { background:#2563eb; }`,
    `.post-preview { background:white; padding:1.75rem; border-radius:1rem; box-shadow:0 1px 4px rgba(15,23,42,0.08); }`,
    `.category-label { display:inline-block; margin:0 0 1rem 0; padding:0.35rem 0.75rem; border-radius:999px; background:#e0f2fe; color:#0369a1; font-size:0.85rem; }`,
    `.excerpt { color:#334155; margin-bottom:1.25rem; font-size:1.05rem; line-height:1.7; }`,
    `.content { color:#111827; line-height:1.75; }`,
    `.content img { max-width:100%; height:auto; border-radius:0.75rem; }`,
    `.preview-footer { margin-top:2rem; padding-top:1rem; border-top:1px solid #e2e8f0; color:#475569; }`
  ]
})
export class PreviewPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly service = inject(CmsService);
  post: any = null;
  blog: any = null;
  themeCssUrl = '';

  constructor() {
    const params = this.route.snapshot.paramMap;
    const blogId = params.get('blogId');
    const postId = params.get('postId');

    if (blogId) {
      this.blog = this.service.blogsSignal().find((b) => b.id === blogId) ?? null;
      this.themeCssUrl = this.service.getThemeCssUrl(this.blog?.theme);
    }

    if (blogId && postId) {
      this.service.loadPreviewPost(blogId, postId).then(async (loaded) => {
        if (!loaded) return;
        // ensure content is hydrated
        const hydrated = await this.service.loadPostById(blogId, loaded.id);
        this.post = hydrated ?? loaded;
      });
    }
  }
}
