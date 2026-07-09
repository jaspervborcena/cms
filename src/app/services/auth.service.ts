import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly firebaseAuth = inject(Auth, { optional: true });

  readonly authSignal = signal<AuthUser | null>(this.readStoredUser());
  readonly isAuthenticated = computed(() => !!this.authSignal());

  constructor() {
    if (this.firebaseAuth) {
      this.firebaseAuth.onAuthStateChanged((user) => {
        const authUser = user ? this.toAuthUser(user) : null;
        this.authSignal.set(authUser);
        this.persistUser(authUser);
      });
    }
  }

  async login(email: string, password: string): Promise<void> {
    try {
      if (this.firebaseAuth) {
        const credential = await signInWithEmailAndPassword(this.firebaseAuth, email, password);
        const authUser = this.toAuthUser(credential.user);
        this.authSignal.set(authUser);
        this.persistUser(authUser);
        return;
      }
    } catch {
      // Fall back to a local demo account when Firebase is not configured.
    }

    const authUser = {
      uid: `local-${email}`,
      email,
      displayName: email.split('@')[0]
    };
    this.authSignal.set(authUser);
    this.persistUser(authUser);
  }

  async register(email: string, password: string): Promise<void> {
    try {
      if (this.firebaseAuth) {
        const credential = await createUserWithEmailAndPassword(this.firebaseAuth, email, password);
        const authUser = this.toAuthUser(credential.user);
        this.authSignal.set(authUser);
        this.persistUser(authUser);
        return;
      }
    } catch {
      // Fall back to a local demo account when Firebase is not configured.
    }

    const authUser = {
      uid: `local-${email}`,
      email,
      displayName: email.split('@')[0]
    };
    this.authSignal.set(authUser);
    this.persistUser(authUser);
  }

  async logout(): Promise<void> {
    if (this.firebaseAuth) {
      await signOut(this.firebaseAuth);
    }

    this.authSignal.set(null);
    this.persistUser(null);
    this.router.navigate(['/']);
  }

  private persistUser(user: AuthUser | null): void {
    if (user) {
      localStorage.setItem('cms-auth-user', JSON.stringify(user));
      return;
    }

    localStorage.removeItem('cms-auth-user');
  }

  private readStoredUser(): AuthUser | null {
    const value = localStorage.getItem('cms-auth-user');
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as AuthUser;
    } catch {
      return null;
    }
  }

  private toAuthUser(user: { uid: string; email: string | null; displayName: string | null }): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    };
  }
}
