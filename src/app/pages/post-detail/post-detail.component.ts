import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { CmsService } from '../../services/cms.service';
import { Post } from '../../models/cms.models';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <article class="detail" *ngIf="post$ | async as post; else loading">
      <h1>{{ post.title }}</h1>
      <p class="meta">{{ post.category }} · {{ post.publishedAt | date }}</p>
      <div class="content" [innerHTML]="post.content"></div>
      <a [routerLink]="['/site', blogId]">Back to site</a>
    </article>
    <ng-template #loading>
      <p>Loading post…</p>
    </ng-template>
  `,
  styles: [
    `.detail { padding:1rem 0; }`,
    `.meta { color:#6b7280; margin-bottom:1rem; }`,
    `a { color:#2563eb; font-weight:600; text-decoration:none; }`
  ]
})
export class PostDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CmsService);
  blogId: string | null = null;

  readonly post$ = this.route.paramMap.pipe(
    map((params) => ({ blogId: params.get('blogId'), slug: params.get('slug') })),
    switchMap(async ({ blogId, slug }) => {
      this.blogId = blogId;
      if (!blogId || !slug) {
        return null;
      }

      let post: Post | null | undefined = this.service.findPostBySlug(blogId, slug);
      if (!post) {
        post = await this.service.loadPostBySlug(blogId, slug);
      }

      if (post && (!post.content || post.content.trim() === '')) {
        return await this.service.loadPostById(blogId, post.id);
      }

      return post ?? null;
    })
  );
}
