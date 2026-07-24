import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CmsService } from '../../services/cms.service';
import { Page } from '../../models/cms.models';

@Component({
  selector: 'app-pages-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="pages-page">
      <header class="page-header">
        <div>
          <p class="muted-label">Pages</p>
          <h1>Page designer</h1>
          <p>Create, edit, and publish site pages with a WYSIWYG editor and menu assignment.</p>
        </div>
        <button class="btn" type="button" (click)="newPage()">+ New Page</button>
      </header>

      <div class="editor-layout">
        <aside class="page-list-panel">
          <div class="list-heading">
            <h2>Your pages</h2>
            <span>{{ service.storePagesSignal().length }} pages</span>
          </div>

          <div *ngIf="service.storePagesSignal().length === 0" class="empty-state">
            <p>No pages created yet. Click New Page to get started.</p>
          </div>

          <div class="page-list" *ngIf="service.storePagesSignal().length > 0">
            <button
              class="page-item"
              *ngFor="let page of service.storePagesSignal()"
              [class.active]="selectedPage()?.id === page.id"
              type="button"
              (click)="selectPage(page)">
              <span>{{ page.title }}</span>
              <small>{{ page.slug }}</small>
            </button>
          </div>
        </aside>

        <section class="page-editor" *ngIf="selectedPage() || showCreate()">
          <div class="editor-header">
            <div>
              <h2>{{ selectedPage() ? 'Edit page' : 'Create new page' }}</h2>
              <p *ngIf="selectedPage()">Editing page <strong>{{ selectedPage()?.title }}</strong>.</p>
            </div>
            <div class="editor-actions">
              <button type="button" class="ghost-btn" (click)="clearSelection()">Clear</button>
              <button type="button" class="btn" [disabled]="form.invalid" (click)="savePage()">
                {{ selectedPage() ? 'Save page' : 'Create page' }}
              </button>
            </div>
          </div>

          <form [formGroup]="form" class="page-form" (ngSubmit)="savePage()">
            <label>Title<input formControlName="title" placeholder="Page title" /></label>
            <label>Slug<input formControlName="slug" placeholder="page-slug" /></label>
            <label>Excerpt<textarea formControlName="excerpt" placeholder="Page summary"></textarea></label>
          </form>

          <div class="editor-toolbar">
            <button type="button" (click)="format('bold')">B</button>
            <button type="button" (click)="format('italic')">I</button>
            <button type="button" (click)="format('underline')">U</button>
            <button type="button" (click)="format('insertUnorderedList')">• List</button>
            <button type="button" (click)="format('insertOrderedList')">1. List</button>
            <button type="button" (click)="createLink()">Link</button>
          </div>

          <div
            #editor
            class="editor-panel"
            contenteditable="true"
            [innerHTML]="form.controls.content.value"
            (input)="syncContent()"
            aria-label="Page content editor"></div>

          <div class="page-footer">
            <button type="button" class="ghost-btn" (click)="clearEditor()">Reset content</button>
            <button type="button" class="btn" [disabled]="form.invalid" (click)="savePage()">
              {{ selectedPage() ? 'Save page' : 'Create page' }}
            </button>
          </div>

          <div class="error" *ngIf="error()">{{ error() }}</div>
        </section>
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
  selectedPage = signal<Page | null>(null);
  showCreate = signal(false);
  error = signal<string | null>(null);
  @ViewChild('editor', { static: false }) editor?: ElementRef<HTMLDivElement>;

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    slug: ['', [Validators.required]],
    excerpt: [''],
    content: ['']
  });

  newPage(): void {
    this.selectedPage.set(null);
    this.showCreate.set(true);
    this.error.set(null);
    this.form.reset({ title: '', slug: '', excerpt: '', content: '' });
    this.updateEditorContent('');
  }

  selectPage(page: Page): void {
    this.selectedPage.set(page);
    this.showCreate.set(false);
    this.error.set(null);
    this.form.setValue({
      title: page.title,
      slug: page.slug,
      excerpt: page.excerpt ?? '',
      content: page.content
    });
    this.updateEditorContent(page.content);
  }

  clearSelection(): void {
    this.selectedPage.set(null);
    this.showCreate.set(false);
    this.error.set(null);
    this.form.reset({ title: '', slug: '', excerpt: '', content: '' });
    this.updateEditorContent('');
  }

  clearEditor(): void {
    this.form.patchValue({ content: '' });
    this.updateEditorContent('');
  }

  syncContent(): void {
    const html = this.editor?.nativeElement.innerHTML ?? '';
    this.form.controls.content.setValue(html);
  }

  format(command: string, value: string = ''): void {
    document.execCommand(command, false, value);
    this.syncContent();
  }

  createLink(): void {
    const url = window.prompt('Enter link URL');
    if (url) {
      document.execCommand('createLink', false, url);
      this.syncContent();
    }
  }

  private updateEditorContent(content: string): void {
    if (this.editor) {
      this.editor.nativeElement.innerHTML = content;
    }
  }

  async savePage(): Promise<void> {
    const store = this.service.activeStoreSignal();
    if (!store) {
      this.error.set('Select a store first before saving this page.');
      return;
    }

    if (this.form.invalid) {
      this.error.set('Title and slug are required.');
      return;
    }

    const { title, slug, excerpt, content } = this.form.getRawValue();
    this.error.set(null);

    try {
      if (this.selectedPage()) {
        const updated = await this.service.updatePage(this.selectedPage()!.id, {
          title,
          slug,
          excerpt,
          content
        });
        if (updated) {
          this.selectPage(updated);
        }
      } else {
        const created = await this.service.createPage({
          title,
          slug,
          excerpt,
          content,
          storeId: store.id
        });
        this.selectPage(created);
      }
    } catch (err: any) {
      this.error.set(err?.message ?? 'Unable to save page.');
    }
  }
}
