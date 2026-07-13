import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-posts-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="posts-page">
      <div class="header-row">
        <h1>Posts</h1>
        <div class="actions">
          <button class="btn" (click)="newPost()">+ New Post</button>
        </div>
      </div>

      <div *ngIf="!cms.activeBlogSignal()" class="empty-state">
        <h3>No blog selected</h3>
        <p>Please create a blog first.</p>
        <a routerLink="/dashboard" class="btn">Create blog</a>
      </div>

      <div *ngIf="cms.activeBlogSignal() && cms.filteredPostsSignal().length === 0" class="empty-state">
        <h3>No posts yet</h3>
        <p>Create your first post for <strong>{{ cms.activeBlogSignal()?.name }}</strong>.</p>
        <a routerLink="/posts/new" class="btn">Create post</a>
      </div>

      <ul *ngIf="cms.activeBlogSignal() && cms.filteredPostsSignal().length > 0" class="posts-list">
        <li *ngFor="let p of cms.filteredPostsSignal()">
          <h4>{{ p.title }}</h4>
          <p class="muted">{{ p.excerpt }}</p>
        </li>
      </ul>
    </section>
  `,
  styles: [
    `.header-row { display:flex; justify-content:space-between; align-items:center; }`,
    `.posts-list { list-style:none; padding:0; margin:1rem 0; display:flex; flex-direction:column; gap:0.75rem; }`,
    `.muted { color:#6b7280; }`,
    `.btn { padding:0.5rem 0.75rem; background:#1d4ed8; color:white; border:none; border-radius:0.4rem; }`
  ]
})
export class PostsListComponent {
  readonly cms = inject(CmsService);
  private router = inject(Router);

  async ngOnInit(): Promise<void> {
    const blog = this.cms.activeBlogSignal();
    if (blog) {
      await this.cms.fetchPostsForBlog(blog.id);
    }
  }

  newPost() {
    const blog = this.cms.activeBlogSignal();
    if (!blog) {
      this.router.navigate(['/onboarding']);
      return;
    }
    this.router.navigate(['/posts/new']);
  }
}
