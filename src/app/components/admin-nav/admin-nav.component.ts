import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-admin-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="admin-nav">
      <div class="brand">Tovrika CMS</div>

      <div class="blogs">
        <h4>Your blogs</h4>
        <ul>
          <li *ngFor="let b of cms.blogsSignal()">
            <a (click)="select(b.id)" [class.active]="cms.activeBlogSignal()?.id === b.id">{{ b.name }}</a>
          </li>
        </ul>
        <a routerLink="/onboarding" class="btn ghost">+ New Blog</a>
      </div>

      <ul class="main-links">
        <li><a routerLink="/posts">Posts</a></li>
        <li><a routerLink="/dashboard">Stats</a></li>
        <li><a routerLink="/dashboard">Comments</a></li>
        <li><a routerLink="/dashboard">Earnings</a></li>
        <li><a routerLink="/pages">Pages</a></li>
        <li><a routerLink="/dashboard">Layout</a></li>
        <li><a routerLink="/dashboard">Theme</a></li>
        <li><a routerLink="/dashboard">Settings</a></li>
      </ul>

      <div class="new-post">
        <a (click)="newPost()" class="btn">+ New Post</a>
      </div>
    </nav>
  `,
  styles: [
    `.admin-nav { display:flex; flex-direction:column; gap:1rem; padding:1rem; background:white; border-right:1px solid #e6eefb; min-height:100vh; }`,
    `.admin-nav .brand { font-weight:800; color:#1d4ed8; text-transform:uppercase; letter-spacing:0.08em; font-size:0.95rem; padding:0.5rem 0; }`,
    `.blogs h4 { margin:0 0 0.25rem 0; color:#374151; font-size:0.9rem; }`,
    `.blogs ul { list-style:none; padding:0; margin:0 0 0.5rem 0; display:flex; flex-direction:column; gap:0.25rem; }`,
    `.blogs a { color:#0f172a; text-decoration:none; padding:0.25rem 0.25rem; display:block; }`,
    `.blogs a.active { font-weight:800; color:#1d4ed8; }`,
    `.main-links { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.25rem; }`,
    `.admin-nav a { color:#0f172a; text-decoration:none; padding:0.5rem 0.25rem; display:block; }`,
    `.admin-nav a:hover { background:#f1f9ff; color:#1d4ed8; border-radius:0.25rem; }`,
    `.new-post { margin-top:auto; }`,
    `.btn { display:inline-block; padding:0.5rem 0.75rem; background:#1d4ed8; color:white; border-radius:0.4rem; text-decoration:none; font-weight:700; }`,
    `.btn.ghost { background:transparent; color:#1d4ed8; border:1px dashed #bfdbfe; padding:0.35rem 0.5rem; border-radius:0.4rem; }`
  ]
})
export class AdminNavComponent {
  readonly cms = inject(CmsService);
  private router = inject(Router);

  select(id: string) {
    this.cms.setActiveBlogById(id);
    this.router.navigate(['/dashboard', id]);
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
