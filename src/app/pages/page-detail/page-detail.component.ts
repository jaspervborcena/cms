import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-page-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <article class="detail" *ngIf="page$ | async as page; else loading">
      <h1>{{ page.title }}</h1>
      <div class="content" [innerHTML]="page.content"></div>
      <a routerLink="/pages">Back to pages</a>
    </article>
    <ng-template #loading>
      <p>Loading page…</p>
    </ng-template>
  `,
  styles: [
    `.detail { padding:1rem 0; }`,
    `a { color:#2563eb; font-weight:600; text-decoration:none; }`
  ]
})
export class PageDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CmsService);

  readonly page$ = this.route.paramMap.pipe(
    map((params) => params.get('slug')),
    switchMap((slug) => {
      if (!slug) {
        return of(null);
      }

      const blog = this.service.hostBlogSignal();
      const page = this.service.pagesSignal().find((item) => item.slug === slug && (!blog || item.blogId === blog.id));
      return of(page ?? null);
    })
  );
}
