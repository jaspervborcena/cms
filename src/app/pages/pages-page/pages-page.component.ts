import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-pages-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="pages-page">
      <header class="page-header">
        <div>
          <h1>Pages</h1>
          <p>Manage the menu pages for your current blog. Default pages Home, About, and Data Privacy are created automatically.</p>
        </div>
        <button class="btn" type="button" (click)="toggleCreate()">+ New Page</button>
      </header>

      <section class="page-editor" *ngIf="showCreate()">
        <h2>Create a page</h2>
        <form [formGroup]="form" (ngSubmit)="createPage()">
          <label>Title<input formControlName="title" /></label>
          <label>Slug<input formControlName="slug" /></label>
          <label>Excerpt<textarea formControlName="excerpt"></textarea></label>
          <label>Content<textarea formControlName="content"></textarea></label>
          <div class="actions">
            <button type="button" class="ghost-btn" (click)="toggleCreate()">Cancel</button>
            <button type="submit" class="btn" [disabled]="form.invalid">Create page</button>
          </div>
          <div class="error" *ngIf="error()">{{ error() }}</div>
        </form>
      </section>

      <section *ngIf="service.blogPagesSignal().length === 0" class="empty-state">
        <p>No pages yet for this blog. Create one to add menu items.</p>
      </section>

      <div class="list" *ngIf="service.blogPagesSignal().length > 0">
        <article class="card" *ngFor="let page of service.blogPagesSignal()">
          <div>
            <h2>{{ page.title }}</h2>
            <p>{{ page.excerpt }}</p>
          </div>
          <a [routerLink]="['/pages', page.slug]">Open</a>
        </article>
      </div>
    </section>
  `,
  styles: [
    `.pages-page { padding: 1.5rem; display: grid; gap: 1.5rem; }`,
    `.page-header { display:flex; justify-content:space-between; align-items:center; gap:1rem; }`,
    `.page-header h1 { margin:0; font-size:2rem; }`,
    `.page-header p { margin:0.5rem 0 0; color:#4b5563; max-width:40rem; }`,
    `.btn { background:#1d4ed8; color:white; border:none; border-radius:0.75rem; padding:0.85rem 1.2rem; cursor:pointer; }`,
    `.ghost-btn { background:transparent; color:#1d4ed8; border:1px solid #1d4ed8; }`,
    `.page-editor { background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:1.5rem; }`,
    `label { display:block; margin-bottom:0.9rem; font-weight:600; }`,
    `input, textarea { width:100%; padding:0.85rem 1rem; border:1px solid #d1d5db; border-radius:0.65rem; font: inherit; }`,
    `textarea { min-height:140px; resize:vertical; }`,
    `.actions { display:flex; gap:0.75rem; justify-content:flex-end; margin-top:1rem; }`,
    `.error { margin-top:1rem; color:#b91c1c; font-weight:700; }`,
    `.list { display:grid; gap:1rem; }`,
    `.card { padding:1.25rem 1.5rem; border:1px solid #e5e7eb; border-radius:1rem; display:flex; justify-content:space-between; align-items:center; gap:1rem; background:white; }`,
    `.card h2 { margin:0 0 0.35rem 0; }`,
    `.card p { margin:0; color:#475569; }`,
    `a { color:#2563eb; font-weight:700; text-decoration:none; }`,
    `@media (max-width: 720px) { .page-header, .card { flex-direction: column; align-items: stretch; } .actions { justify-content: stretch; flex-direction: column; } }`
  ]
})
export class PagesPageComponent {
  readonly service = inject(CmsService);
  private fb = inject(FormBuilder);
  showCreate = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    slug: ['', [Validators.required]],
    excerpt: [''],
    content: ['']
  });

  toggleCreate(): void {
    this.error.set(null);
    this.showCreate.update((current) => !current);
  }

  async createPage(): Promise<void> {
    const blog = this.service.activeBlogSignal();
    if (!blog) {
      this.error.set('Select a blog first before creating a page.');
      return;
    }

    if (this.form.invalid) {
      this.error.set('Title and slug are required.');
      return;
    }

    const { title, slug, excerpt, content } = this.form.getRawValue();
    this.error.set(null);

    try {
      await this.service.createPage({
        title,
        slug,
        excerpt,
        content,
        blogId: blog.id
      });
      this.form.reset({ title: '', slug: '', excerpt: '', content: '' });
      this.showCreate.set(false);
    } catch (err: any) {
      this.error.set(err?.message ?? 'Unable to create page.');
    }
  }
}
