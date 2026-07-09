import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CmsService } from '../../services/cms.service';
import { Post } from '../../models/cms.models';

@Component({
  selector: 'app-new-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="new-post">
      <div class="page-header">
        <div>
          <p class="muted-label">Posts</p>
          <h1>Create new post</h1>
        </div>
        <div class="page-actions">
          <button type="button" class="ghost-btn" (click)="saveDraft()">Save Draft</button>
          <button type="button" class="ghost-btn" [disabled]="!currentPost" (click)="preview()">Preview</button>
          <button type="button" class="btn" [disabled]="form.invalid" (click)="publish()">Publish</button>
        </div>
      </div>

      <form [formGroup]="form" class="editor-shell" (ngSubmit)="saveDraft()">
        <label>Title<input formControlName="title" placeholder="Post title" /></label>
        <label>Excerpt<textarea formControlName="excerpt" placeholder="Short summary"></textarea></label>

        <div *ngIf="saveError()" class="error-message">{{ saveError() }}</div>

        <div class="editor-toolbar">
          <button type="button" (click)="format('undo')" title="Undo">↺</button>
          <button type="button" (click)="format('redo')" title="Redo">↻</button>
          <button type="button" (click)="format('bold')" title="Bold"><strong>B</strong></button>
          <button type="button" (click)="format('italic')" title="Italic"><em>I</em></button>
          <button type="button" (click)="format('underline')" title="Underline"><u>U</u></button>
          <button type="button" (click)="format('strikeThrough')" title="Strike">S</button>
          <button type="button" (click)="format('formatBlock', 'H2')" title="Heading">H2</button>
          <button type="button" (click)="format('formatBlock', 'BLOCKQUOTE')" title="Quote">❝</button>
          <button type="button" (click)="format('insertUnorderedList')" title="Bulleted list">• List</button>
          <button type="button" (click)="format('insertOrderedList')" title="Numbered list">1. List</button>
          <button type="button" (click)="format('justifyLeft')" title="Align left">⟵</button>
          <button type="button" (click)="format('justifyCenter')" title="Center">↔</button>
          <button type="button" (click)="format('justifyRight')" title="Align right">⟶</button>
          <button type="button" (click)="createLink()" title="Add link">🔗</button>
          <button type="button" (click)="triggerImageUpload()" title="Insert image">🖼️</button>
        </div>

        <input type="file" #imageInput accept="image/*" hidden (change)="handleImageUpload($event)" />

        <div class="editor-pane">
          <div class="editor-panel" #editor contenteditable="true" (input)="syncContent()" aria-label="Post content editor"></div>
        </div>

        <textarea formControlName="content" hidden></textarea>
      </form>
    </section>
  `,
  styles: [
    `.new-post { max-width:900px; margin:1.5rem; }`,
    `.page-header { display:flex; align-items:flex-end; justify-content:space-between; gap:1rem; margin-bottom:1rem; }`,
    `.page-actions { display:flex; gap:0.75rem; align-items:center; }`,
    `.ghost-btn, .btn { padding:0.75rem 1rem; border-radius:0.65rem; font-weight:700; cursor:pointer; min-height:44px; }`,
    `.ghost-btn { background:#eff6ff; border:1px solid #1d4ed8; color:#1d4ed8; }`,
    `.ghost-btn:hover { background:#dbeafe; }`,
    `.btn { background:#1d4ed8; color:white; border:none; }`,
    `.btn:hover { background:#2563eb; }`,
    `.muted-label { margin:0 0 0.4rem 0; color:#6b7280; text-transform:uppercase; letter-spacing:0.12em; font-size:0.75rem; }`,
    `h1 { margin:0; font-size:2rem; }`,
    `label { display:block; margin:0.75rem 0 0.5rem; color:#111827; font-weight:600; }`,
    `input, textarea { width:100%; padding:0.85rem 1rem; border:1px solid #d1d5db; border-radius:0.65rem; font-size:1rem; }`,
    `textarea { min-height:120px; resize:vertical; }`,
    `.editor-toolbar { display:flex; flex-wrap:wrap; gap:0.5rem; margin:1rem 0 0.75rem; }`,
    `.editor-toolbar button { background:#f8fafc; border:1px solid #d1d5db; border-radius:0.5rem; padding:0.55rem 0.75rem; color:#111827; cursor:pointer; }`,
    `.editor-toolbar button:hover { background:#eff6ff; border-color:#bfdbfe; }`,
    `.editor-panel { min-height:320px; border:1px solid #d1d5db; border-radius:0.75rem; padding:1rem; background:white; outline:none; }`,
    `.editor-panel:focus { box-shadow:0 0 0 3px rgba(59,130,246,0.18); border-color:#2563eb; }`,
    `.error-message { color:#b91c1c; margin:0.75rem 0; font-weight:700; }`,
    `.actions { margin-top:1.25rem; }`,
    `.btn { padding:0.75rem 1rem; background:#1d4ed8; color:white; border:none; border-radius:0.65rem; font-weight:700; cursor:pointer; }`
  ]
})
export class NewPostComponent implements OnInit {
  @ViewChild('editor', { static: true }) editor?: ElementRef<HTMLDivElement>;
  @ViewChild('imageInput', { static: true }) imageInput?: ElementRef<HTMLInputElement>;

  private fb = inject(FormBuilder);
  private cms = inject(CmsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly saveError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    excerpt: [''],
    content: ['']
  });

  currentPost: Post | null = null;

  ngOnInit(): void {
    const postId = this.route.snapshot.paramMap.get('postId');
    const blog = this.cms.activeBlogSignal();

    if (!blog || !postId) return;

    this.cms.loadPostById(blog.id, postId).then((post) => {
      if (!post) return;
      this.currentPost = post;
      this.form.setValue({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content
      });
      if (this.editor) {
        this.editor.nativeElement.innerHTML = post.content;
      }
    });
  }

  async saveDraft(): Promise<void> {
    const blog = this.cms.activeBlogSignal();
    if (!blog) {
      this.router.navigate(['/onboarding']);
      return;
    }

    const { title, excerpt, content } = this.form.getRawValue();
    this.saveError.set(null);

    try {
      if (this.currentPost) {
        const updated = await this.cms.updatePost(blog.id, this.currentPost.id, {
          title,
          excerpt,
          content,
          status: 'draft'
        });
        if (updated) {
          this.currentPost = updated;
        }
        return;
      }

      const created = await this.cms.createPost(blog.id, { title, excerpt, content, status: 'draft' });
      this.currentPost = created;
    } catch (error: any) {
      this.saveError.set(error?.message ?? 'Unable to save draft. Make sure you are online and connected to Firestore.');
    }
  }

  async preview(): Promise<void> {
    const blog = this.cms.activeBlogSignal();
    if (!blog) {
      this.router.navigate(['/onboarding']);
      return;
    }

    const navigatePreview = (postId: string) => {
      window.open(`${window.location.origin}/preview/${blog.id}/${postId}`, '_blank');
    };

    const { title, excerpt, content } = this.form.getRawValue();
    this.saveError.set(null);

    try {
      if (this.currentPost) {
        const updated = await this.cms.updatePost(blog.id, this.currentPost.id, {
          title,
          excerpt,
          content,
          status: 'draft'
        });
        if (updated) {
          this.currentPost = updated;
          navigatePreview(updated.id);
        }
        return;
      }

      const created = await this.cms.createPost(blog.id, { title, excerpt, content, status: 'draft' });
      this.currentPost = created;
      navigatePreview(created.id);
    } catch (error: any) {
      this.saveError.set(error?.message ?? 'Unable to save preview. Make sure you are online and connected to Firestore.');
    }
  }

  async publish(): Promise<void> {
    const blog = this.cms.activeBlogSignal();
    if (!blog) {
      this.router.navigate(['/onboarding']);
      return;
    }

    const navigatePublished = (slug: string) => {
      window.open(this.cms.getPublicPostUrl(blog, slug), '_blank');
    };

    const { title, excerpt, content } = this.form.getRawValue();
    this.saveError.set(null);

    try {
      if (this.currentPost) {
        const updated = await this.cms.updatePost(blog.id, this.currentPost.id, {
          title,
          excerpt,
          content,
          status: 'published'
        });
        if (updated) {
          navigatePublished(updated.slug);
        }
        return;
      }

      const created = await this.cms.createPost(blog.id, { title, excerpt, content, status: 'published' });
      this.currentPost = created;
      navigatePublished(created.slug);
    } catch (error: any) {
      this.saveError.set(error?.message ?? 'Unable to publish post. Make sure you are online and connected to Firestore.');
    }
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

  triggerImageUpload(): void {
    this.imageInput?.nativeElement.click();
  }

  handleImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const imageUrl = reader.result as string;
      const finalUrl = await this.processImageForEditor(imageUrl);
      document.execCommand('insertImage', false, finalUrl);
      this.syncContent();
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  private async processImageForEditor(imageUrl: string): Promise<string> {
    const maxMm = 10;
    const dpi = 96;
    const maxPx = Math.round((maxMm / 25.4) * dpi);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const maxSize = Math.max(width, height);
        if (maxSize <= maxPx) {
          resolve(imageUrl);
          return;
        }

        const scale = maxPx / maxSize;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png', 0.92));
      };
      img.src = imageUrl;
    });
  }

  syncContent(): void {
    if (!this.editor) return;
    this.form.patchValue({ content: this.editor.nativeElement.innerHTML });
  }
}
