import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-card">
      <h1>{{ mode === 'login' ? 'Login' : 'Register' }}</h1>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>
          Email
          <input formControlName="email" type="email" />
        </label>
        <label>
          Password
          <input formControlName="password" type="password" />
        </label>
        <button type="submit" [disabled]="form.invalid">Continue</button>
      </form>
      <p class="switch">
        <span *ngIf="mode === 'login'">Need an account?</span>
        <span *ngIf="mode !== 'login'">Already have an account?</span>
        <a [routerLink]="mode === 'login' ? '/register' : '/login'">{{ mode === 'login' ? 'Register' : 'Login' }}</a>
      </p>
    </section>
  `,
  styles: [
    `.auth-card { max-width: 28rem; margin: 3rem auto; padding: 1.5rem; background: white; border: 1px solid #e5e7eb; border-radius: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }`,
    `form { display:flex; flex-direction:column; gap:1rem; margin-top:1rem; }`,
    `label { display:flex; flex-direction:column; gap:0.35rem; font-weight:600; }`,
    `input { padding:0.75rem; border:1px solid #d1d5db; border-radius:0.6rem; }`,
    `button { padding:0.8rem 1rem; border:none; border-radius:0.6rem; background:#111827; color:white; font-weight:700; cursor:pointer; }`,
    `.switch { margin-top:1rem; color:#4b5563; }`,
    `.switch a { color:#2563eb; font-weight:700; text-decoration:none; }`
  ]
})
export class AuthComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly mode: 'login' | 'register' = this.router.url.includes('/register') ? 'register' : 'login';

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const { email, password } = this.form.getRawValue();
    if (this.mode === 'register') {
      await this.authService.register(email, password);
    } else {
      await this.authService.login(email, password);
    }

    this.router.navigate(['/dashboard']);
  }
}
