import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface AuthFormValue {
  email: string;
  password: string;
  confirmPassword?: string;
}

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
          <div class="password-field">
            <input [type]="passwordHidden() ? 'password' : 'text'" formControlName="password" />
            <button type="button" class="toggle" (click)="passwordHidden.set(!passwordHidden())">
              {{ passwordHidden() ? 'Show' : 'Hide' }}
            </button>
          </div>
        </label>
        <label *ngIf="mode === 'register'">
          Confirm Password
          <div class="password-field">
            <input [type]="confirmPasswordHidden() ? 'password' : 'text'" formControlName="confirmPassword" />
            <button type="button" class="toggle" (click)="confirmPasswordHidden.set(!confirmPasswordHidden())">
              {{ confirmPasswordHidden() ? 'Show' : 'Hide' }}
            </button>
          </div>
        </label>
        <p class="error" *ngIf="confirmPasswordControl?.hasError('required') && (confirmPasswordControl?.dirty || confirmPasswordControl?.touched)">
          Confirm password is required.
        </p>
        <p class="error" *ngIf="form.hasError('passwordsMismatch') && (confirmPasswordControl?.dirty || confirmPasswordControl?.touched)">
          Passwords do not match.
        </p>
        <button type="submit" [disabled]="form.invalid">Continue</button>
      </form>
      <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
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
    `.password-field { display:flex; align-items:center; gap:0.5rem; }`,
    `.password-field input { flex:1; }`,
    `.toggle { background: transparent; color:#111827; border:none; cursor:pointer; font-weight:700; padding:0 0.5rem; }`,
    `.error { color:#b91c1c; margin-top:0.75rem; font-weight:600; }`,
    `.switch { margin-top:1rem; color:#4b5563; }`,
    `.switch a { color:#2563eb; font-weight:700; text-decoration:none; }`
  ]
})

export class AuthComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly mode: 'login' | 'register' = this.router.url.includes('/register') ? 'register' : 'login';

  readonly passwordHidden = signal(true);
  readonly confirmPasswordHidden = signal(true);

  readonly form: FormGroup = this.buildForm();

  readonly errorMessage = signal<string | null>(null);

  get confirmPasswordControl(): FormControl | null {
    return this.form.get('confirmPassword') as FormControl | null;
  }

  private buildForm(): FormGroup {
    if (this.mode === 'register') {
      return this.fb.group({
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required, Validators.minLength(6)]),
        confirmPassword: new FormControl('', [Validators.required])
      }, { validators: this.passwordsMatch.bind(this) });
    }

    return this.fb.group({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)])
    });
  }

  private passwordsMatch(control: AbstractControl): ValidationErrors | null {
    if (this.mode !== 'register') {
      return null;
    }

    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    try {
      if (this.mode === 'register') {
        await this.authService.register(email, password);
      } else {
        await this.authService.login(email, password);
      }
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage.set(error?.message ?? 'An unexpected error occurred.');
    }
  }
}
