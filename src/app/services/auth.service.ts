import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { getAuthErrorMessage } from '../messages/auth-messages';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly firebaseAuth = inject(Auth, { optional: true });
  private readonly firestore = inject(Firestore, { optional: true });

  readonly authSignal = signal<AuthUser | null>(this.readStoredUser());
  readonly isAuthenticated = computed(() => !!this.authSignal());
  readonly isFirebaseInitialized = computed(() => !!this.firebaseAuth);

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
    if (!this.firebaseAuth) {
      // Demo mode - create a local session
      const authUser = {
        uid: `local-${Date.now()}`,
        email,
        displayName: email.split('@')[0]
      };
      this.authSignal.set(authUser);
      this.persistUser(authUser);
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(this.firebaseAuth, email, password);
      const authUser = this.toAuthUser(credential.user);
      this.authSignal.set(authUser);
      this.persistUser(authUser);
      await this.ensureUserDocument(authUser, false);
      return;
    } catch (error: any) {
      const message = getAuthErrorMessage(error?.code);
      throw new Error(message);
    }
  }

  async register(email: string, password: string): Promise<void> {
    if (!this.firebaseAuth) {
      const authUser = {
        uid: `local-${email}`,
        email,
        displayName: email.split('@')[0]
      };
      this.authSignal.set(authUser);
      this.persistUser(authUser);
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(this.firebaseAuth, email, password);
      const authUser = this.toAuthUser(credential.user);
      this.authSignal.set(authUser);
      this.persistUser(authUser);
      await this.ensureUserDocument(authUser, true);
      return;
    } catch (error: any) {
      const message = getAuthErrorMessage(error?.code);
      throw new Error(message);
    }
  }

  private async ensureUserDocument(user: AuthUser, isNewUser: boolean): Promise<void> {
    if (!this.firestore || !user?.uid) {
      return;
    }

    const now = new Date().toISOString();
    const userDoc = doc(this.firestore, `users/${user.uid}`);
    const payload = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: this.firebaseAuth?.currentUser?.emailVerified ?? false,
      roles: ['creator'],
      roleId: 4,
      blogsOwned: [],
      blogsMember: [],
      status: 'active',
      lastLogin: now,
      updatedAt: now,
      ...(isNewUser ? { createdAt: now } : {})
    };

    await setDoc(userDoc, payload, { merge: true });
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
