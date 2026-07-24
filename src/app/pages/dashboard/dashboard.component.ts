import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// header/footer/sidebar are provided at the app root layout
import { CmsService } from '../../services/cms.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-shell">
      <main class="dashboard-main-inner">
        <div class="welcome-bar">
          <div>
            <h1>Welcome back</h1>
            <p>Manage your editorial workspace and publish new content.</p>
          </div>
          <button type="button" (click)="logout()">Logout</button>
        </div>

        <section class="posts-list">
          <div *ngIf="!cms.activeStoreSignal()" class="empty-state">
            <h2>No store selected</h2>
            <p>Create your first store to unlock the dashboard features.</p>
            <div class="actions">
              <a routerLink="/onboarding" class="btn">Create a store</a>
            </div>
          </div>

          <div class="notices">
            <div class="notice">Notices (1) — Try the new beta features.</div>
          </div>
          <div *ngIf="cms.activeStoreSignal()">
            <div *ngIf="cms.filteredPostsSignal().length === 0" class="empty-state">
              <h3>No posts yet</h3>
              <p>Start by creating your first post for <strong>{{ cms.activeStoreSignal()?.name }}</strong>.</p>
              <div class="actions">
                <a routerLink="/posts/new" class="btn">Create first post</a>
              </div>
            </div>

            <div class="list">
              <div *ngFor="let post of cms.filteredPostsSignal()" class="post-row">
                <div class="thumb"></div>
                <div class="meta">
                  <h3>{{ post.title }}</h3>
                  <p class="muted">{{ post.excerpt }}</p>
                </div>
                <div class="actions">
                  <button class="btn small">Preview</button>
                  <button class="btn small">Publish</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [
    `.dashboard-shell { min-height: 100vh; display: flex; flex-direction: column; }`,
    `.dashboard-main { display: grid; grid-template-columns: 2fr minmax(260px, 320px); gap: 1.5rem; padding: 1.5rem; flex: 1; }`,
    `.welcome-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; padding:1rem 1.25rem; background:white; border:1px solid #e5e7eb; border-radius:0.9rem; }`,
    `button { padding:0.7rem 1rem; border:none; border-radius:0.6rem; background:#111827; color:white; cursor:pointer; }`,
    `.grid { display:grid; gap:1rem; grid-template-columns:repeat(auto-fit,minmax(220px, 1fr)); }`,
    `.card { padding:1rem; border:1px solid #e5e7eb; border-radius:0.85rem; background:white; box-shadow:0 1px 3px rgba(0,0,0,0.05); }`,
    `@media (max-width: 860px) { .dashboard-main { grid-template-columns: 1fr; } }`
  ]
})
export class DashboardComponent {
  readonly cms = inject(CmsService);
  readonly auth = inject(AuthService);

  async logout(): Promise<void> {
    await this.auth.logout();
  }

  async ngOnInit(): Promise<void> {
    const store = this.cms.activeStoreSignal();
    if (store) {
      await this.cms.fetchPostsForStore(store.id, 10);
    }
  }
}
