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

      <div class="stores">
        <h4>Your stores</h4>
        <ul>
          <li *ngFor="let b of cms.storesSignal()">
            <div class="store-entry">
              <a (click)="select(b.id)" [class.active]="cms.activeStoreSignal()?.id === b.id">{{ b.name }}</a>
              <button class="delete-btn" (click)="confirmDelete(b.id, b.name, $event)" title="Delete store">×</button>
            </div>
          </li>
        </ul>
        <a routerLink="/dashboard" class="btn ghost">+ New Store</a>
      </div>

      <ul class="main-links">
        <li><a routerLink="/pages">Pages</a></li>
        <li><a routerLink="/posts">Posts</a></li>
        <li><a routerLink="/dashboard">Dashboard</a></li>
        <li><a (click)="openTheme()">Theme</a></li>
        <li><a (click)="openTemplate()">Template</a></li>
        <li><a routerLink="/dashboard">Settings</a></li>
      </ul>

      <div class="new-post">
        <a (click)="newPost()" class="btn">+ New Post</a>
      </div>

      <!-- DELETE CONFIRMATION MODAL -->
      <div class="modal" *ngIf="showDeleteConfirm">
        <div class="modal-content">
          <h3>Delete Store?</h3>
          <p>Are you sure you want to delete <strong>{{ deleteStoreName }}</strong>?</p>
          <p class="warning">This will permanently delete the store and all its posts and pages.</p>
          <div class="modal-actions">
            <button class="btn btn-danger" (click)="confirmDeleteAction()">Delete</button>
            <button class="btn btn-secondary" (click)="cancelDelete()">Cancel</button>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `.admin-nav { display:flex; flex-direction:column; gap:1rem; padding:1rem; background:white; border-right:1px solid #e6eefb; min-height:100vh; position:relative; }`,
    `.admin-nav .brand { font-weight:800; color:#1d4ed8; text-transform:uppercase; letter-spacing:0.08em; font-size:0.95rem; padding:0.5rem 0; }`,
    `.stores h4 { margin:0 0 0.25rem 0; color:#374151; font-size:0.9rem; }`,
    `.stores ul { list-style:none; padding:0; margin:0 0 0.5rem 0; display:flex; flex-direction:column; gap:0.5rem; }`,
    `.store-entry { display:flex; align-items:center; justify-content:space-between; gap:0.5rem; }`,
    `.stores a { color:#0f172a; text-decoration:none; padding:0.25rem 0.25rem; display:block; flex:1; }`,
    `.stores a.active { font-weight:800; color:#1d4ed8; }`,
    `.delete-btn { width: 2rem; height: 2rem; border: none; background: transparent; color: #ef4444; font-size: 1.2rem; cursor: pointer; border-radius: 0.5rem; }`,
    `.delete-btn:hover { background: rgba(239, 68, 68, 0.12); }`,
    `.main-links { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.25rem; }`,
    `.admin-nav a { color:#0f172a; text-decoration:none; padding:0.5rem 0.25rem; display:block; }`,
    `.admin-nav a:hover { background:#f1f9ff; color:#1d4ed8; border-radius:0.25rem; }`,
    `.new-post { margin-top:auto; }`,
    `.btn { display:inline-block; padding:0.5rem 0.75rem; background:#1d4ed8; color:white; border-radius:0.4rem; text-decoration:none; font-weight:700; border:none; cursor:pointer; }`,
    `.btn.ghost { background:transparent; color:#1d4ed8; border:1px dashed #bfdbfe; padding:0.35rem 0.5rem; border-radius:0.4rem; }`,
    `.modal { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; }`,
    `.modal-content { background:white; border-radius:0.5rem; padding:2rem; max-width:400px; box-shadow:0 10px 40px rgba(0,0,0,0.2); }`,
    `.modal-content h3 { margin:0 0 1rem 0; font-size:1.25rem; }`,
    `.modal-content p { margin:0.5rem 0; color:#374151; }`,
    `.warning { color:#dc2626; font-weight:600; }`,
    `.modal-actions { display:flex; gap:1rem; margin-top:1.5rem; }`,
    `.btn-danger { background:#dc2626; }`,
    `.btn-danger:hover { background:#b91c1c; }`,
    `.btn-secondary { background:#d1d5db; color:#374151; }`,
    `.btn-secondary:hover { background:#9ca3af; }`,
    `.modal-actions .btn { flex:1; }`,
    `a { cursor:pointer; }`
  ]
})
export class AdminNavComponent {
  readonly cms = inject(CmsService);
  private router = inject(Router);

  select(id: string) {
    this.cms.setActiveStoreById(id);
    this.router.navigate(['/dashboard', id]);
  }

  confirmDelete(storeId: string, storeName: string, event: Event) {
    event.stopPropagation();
    this.deleteStoreId = storeId;
    this.deleteStoreName = storeName;
    this.showDeleteConfirm = true;
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.deleteStoreId = '';
    this.deleteStoreName = '';
  }

  async confirmDeleteAction() {
    await this.cms.deleteStoreWithCascade(this.deleteStoreId);
    this.showDeleteConfirm = false;
    this.deleteStoreId = '';
    this.deleteStoreName = '';
    
    if (this.cms.activeStoreSignal()?.id === this.deleteStoreId) {
      this.router.navigate(['/dashboard']);
    }
  }

  newPost() {
    const store = this.cms.activeStoreSignal();
    if (!store) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.router.navigate(['/posts/new']);
  }

  openTheme() {
    const store = this.cms.activeStoreSignal();
    if (!store) return;
    this.router.navigate(['/dashboard', store.id, 'theme']);
  }

  openTemplate() {
    const store = this.cms.activeStoreSignal();
    if (!store) return;
    this.router.navigate(['/dashboard', store.id, 'template-designer']);
  }

  showDeleteConfirm = false;
  deleteStoreId = '';
  deleteStoreName = '';
}
