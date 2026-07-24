import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CmsService } from '../../services/cms.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="header">
      <div class="brand">Tovrika CMS</div>
      <nav class="nav">
        <div class="spacer"></div>
        <a *ngIf="cms.activeStoreSignal()" routerLink="/products" class="nav-link">Products</a>
        <div class="account">
          <span class="avatar">{{ auth.authSignal()?.displayName?.charAt(0)?.toUpperCase() || 'U' }}</span>
          <span class="name">{{ auth.authSignal()?.displayName || auth.authSignal()?.email || 'Account' }}</span>
        </div>
      </nav>
    </header>
  `,
  styles: [
    `.header { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.5rem; background:#1d4ed8; color:white; border-bottom:1px solid #2563eb; }`,
    `.nav { display:flex; gap:1rem; align-items:center; width:100%; }`,
    `.nav .spacer { flex:1 1 auto; }`,
    
    `.account { display:flex; align-items:center; gap:0.5rem; margin-left:0.75rem; }
    .avatar { width:32px; height:32px; border-radius:999px; background:rgba(255,255,255,0.15); display:inline-flex; align-items:center; justify-content:center; font-weight:800; }
    .name { font-weight:600; color:white; }`,
    `.nav a:hover { text-decoration:underline; }`,
    `.brand { font-weight:700; letter-spacing:0.08em; text-transform:uppercase; }`
  ]
})
export class HeaderComponent {
  readonly cms = inject(CmsService);
  readonly auth = inject(AuthService);
  private router = inject(Router);

  switchStore(id: string) {
    if (!id) return;
    this.cms.setActiveStoreById(id);
    this.router.navigate(['/dashboard', id]);
  }
}
