import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AdminNavComponent } from './components/admin-nav/admin-nav.component';
import { AuthService } from './services/auth.service';
import { CmsService } from './services/cms.service';
import { Blog } from './models/cms.models';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, HeaderComponent, FooterComponent, SidebarComponent, AdminNavComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  readonly title = 'cms';
  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  readonly cms = inject(CmsService);

  private readonly redirectToBlogHome = effect(() => {
    const blog = this.cms.findBlogByHostName(window.location.hostname);
    if (blog && this.currentUrl === '/') {
      this.router.navigate(['/site', blog.id]);
    }
  });

  private get currentUrl(): string {
    // ignore fragment and query params when computing layout decisions
    const raw = this.router.url || '';
    return raw.split('?')[0].split('#')[0];
  }

  get isPreviewRoute(): boolean {
    return this.currentUrl.startsWith('/preview');
  }

  get isSiteRoute(): boolean {
    return this.currentUrl.startsWith('/site');
  }

  get isBlogHostRoute(): boolean {
    const blog = this.cms.findBlogByHostName(window.location.hostname);
    return !!blog;
  }

  get isPublicRoute(): boolean {
    const url = this.currentUrl;
    return url === '/' || url === '/login' || url === '/register';
  }
}
