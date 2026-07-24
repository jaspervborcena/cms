import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-posts-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h1>Posts</h1>
    <div class="list">
      <article class="card" *ngFor="let post of service.postsSignal()">
        <h2>{{ post.title }}</h2>
        <p>{{ post.excerpt }}</p>
        <a [routerLink]="['/posts', post.slug]">Open post</a>
      </article>
    </div>
  `,
  styles: [
    `.list { display:grid; gap:1rem; }`,
    `.card { padding:1rem; border:1px solid #e5e7eb; border-radius:0.75rem; background:white; }`,
    `a { color:#2563eb; font-weight:600; text-decoration:none; }`
  ]
})
export class PostsPageComponent {
  readonly service = inject(CmsService);

  async ngOnInit(): Promise<void> {
    const store = this.service.activeStoreSignal();
    if (store) {
      await this.service.fetchPostsForBlog(store.id);
    }
  }
}
