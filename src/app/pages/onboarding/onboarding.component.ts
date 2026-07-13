import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CmsService } from '../../services/cms.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="onboard">
      <h1>Get started with your first blog</h1>

      <div class="steps">
        <div *ngIf="step === 1">
          <form [formGroup]="form1" (ngSubmit)="createBlog()">
            <label>Blog name<input formControlName="name" /></label>
            <label>Short description<textarea formControlName="description"></textarea></label>
            <label>Category<select formControlName="category"><option value="personal">Personal</option><option value="business">Business</option><option value="ecommerce">E‑commerce</option></select></label>
            <div class="actions"><button type="submit" [disabled]="form1.invalid">Create blog</button></div>
          </form>
        </div>

        <div *ngIf="step === 2">
          <h2>Pick a starter theme</h2>
          <div class="themes">
            <button *ngFor="let t of themes" (click)="selectTheme(t)" [class.active]="selectedTheme===t">{{ t }}</button>
          </div>

          <h2 style="margin-top:2rem">Pick a template layout</h2>
          <div class="templates">
            <button *ngFor="let t of templates" (click)="selectTemplate(t)" [class.active]="selectedTemplate===t">{{ t }}</button>
          </div>
          
          <div class="actions">
            <button (click)="back()">Back</button>
            <button (click)="applyTheme()" [disabled]="!selectedTheme || !selectedTemplate">Save & continue</button>
          </div>
        </div>

        <div *ngIf="step === 3">
          <h2>Connect a domain (optional)</h2>
          <form [formGroup]="form3" (ngSubmit)="finish()">
            <label>Custom domain<input formControlName="domain" placeholder="example.com" /></label>
            <p class="muted">Or use the automatic subdomain we provide after setup.</p>
            <div class="actions">
              <button (click)="back()" type="button">Back</button>
              <button type="submit">Finish and go to dashboard</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `,
  styles: [
    `.onboard { max-width:720px; margin:2rem auto; padding:1.25rem; }`,
    `label { display:block; margin:0.5rem 0; font-weight:600; }`,
    `input, textarea, select { width:100%; padding:0.5rem; border:1px solid #d1d5db; border-radius:0.5rem; }`,
    `.actions { margin-top:1rem; display:flex; gap:0.5rem; }`,
    `button { padding:0.6rem 0.9rem; border-radius:0.45rem; border:none; background:#1d4ed8; color:white; font-weight:700; }`,
    `.themes { display:flex; gap:0.5rem; margin:1rem 0; flex-wrap: wrap; }`,
    `.themes button { background:#e6f0ff; color:#1d4ed8; border:none; padding:0.5rem 0.8rem; border-radius:0.4rem; }`,
    `.themes button.active { background:#1d4ed8; color:white; }`,
    `.templates { display:flex; gap:0.5rem; margin:1rem 0; flex-wrap: wrap; }`,
    `.templates button { background:#e6f0ff; color:#1d4ed8; border:none; padding:0.5rem 0.8rem; border-radius:0.4rem; }`,
    `.templates button.active { background:#1d4ed8; color:white; }`,
    `.muted { color:#6b7280; font-size:0.95rem; }
    `
  ]
})
export class OnboardingComponent {
  private fb = inject(FormBuilder);
  private cms = inject(CmsService);
  private auth = inject(AuthService);
  private router = inject(Router);

  step = 1;
  themes = this.cms.getAvailableThemes().map(t => t.label);
  templates = this.cms.getAvailableTemplates().map(t => t.label);
  selectedTheme: string | null = null;
  selectedTemplate: string | null = null;

  form1 = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
    category: ['personal']
  });

  form3 = this.fb.nonNullable.group({ domain: [''] });

  async createBlog(): Promise<void> {
    if (this.form1.invalid) return;
    const { name, description, category } = this.form1.getRawValue();
    const ownerUid = this.auth.authSignal() ? this.auth.authSignal()!.uid : null;
    const blog = await this.cms.createBlog({ name, description, category, ownerUid });
    this.step = 2;
    // store blog id locally already handled by CmsService
    this.selectedTheme = blog.theme ?? 'Default';
    this.selectedTemplate = blog.template ?? 'Default';
  }

  back() { this.step = Math.max(1, this.step - 1); }

  selectTheme(t: string) { this.selectedTheme = t; }

  selectTemplate(t: string) { this.selectedTemplate = t; }

  async applyTheme(): Promise<void> {
    const blog = this.cms.activeBlogSignal();
    if (!blog) return;
    
    // Find the theme ID from the label
    const themeLabel = this.selectedTheme ?? 'Default';
    const themeObj = this.cms.getAvailableThemes().find(t => t.label === themeLabel);
    const themeId = themeObj?.id ?? 'default';
    
    // Find the template ID from the label
    const templateLabel = this.selectedTemplate ?? 'Default';
    const templateObj = this.cms.getAvailableTemplates().find(t => t.label === templateLabel);
    const templateId = templateObj?.id ?? 'default';
    
    await Promise.all([
      this.cms.setBlogTheme(blog.id, themeId),
      this.cms.setBlogTemplate(blog.id, templateId)
    ]);
    this.step = 3;
  }

  async finish(): Promise<void> {
    const blog = this.cms.activeBlogSignal();
    if (!blog) return;
    const domain = this.form3.getRawValue().domain || undefined;
    if (domain) {
      await this.cms.setBlogDomain(blog.id, domain);
    }

    // navigate to blog-scoped dashboard
    this.router.navigate(['/dashboard', blog.id]);
  }
}
