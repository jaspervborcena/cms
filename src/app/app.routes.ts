import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { AuthComponent } from './pages/auth/auth.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PreviewPageComponent } from './pages/preview-page/preview-page.component';
import { SitePageComponent } from './pages/site-page/site-page.component';
import { PostDetailComponent } from './pages/post-detail/post-detail.component';
import { PagesPageComponent } from './pages/pages-page/pages-page.component';
import { PublicHostComponent } from './pages/public-host/public-host.component';
import { authGuard } from './guards/auth.guard';
import { ensureBlogGuard } from './guards/ensure-blog.guard';
import { NewPostComponent } from './pages/new-post/new-post.component';
import { PostsListComponent } from './pages/posts-list/posts-list.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: AuthComponent },
  { path: 'register', component: AuthComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard, ensureBlogGuard] },
  { path: 'dashboard/:blogId', component: DashboardComponent, canActivate: [authGuard, ensureBlogGuard] },
  { path: 'dashboard/:blogId/theme', loadComponent: () => import('./pages/theme-settings/theme-settings.component').then(m => m.ThemeSettingsComponent), canActivate: [authGuard, ensureBlogGuard] },
  { path: 'dashboard/:blogId/template-designer', loadComponent: () => import('./pages/template-designer/template-designer.component').then(m => m.TemplateDesignerComponent), canActivate: [authGuard, ensureBlogGuard] },
  { path: 'dashboard/global-theme/settings', loadComponent: () => import('./pages/global-theme-config/global-theme-config.component').then(m => m.GlobalThemeConfigComponent), canActivate: [authGuard] },
  { path: 'pages', component: PagesPageComponent, canActivate: [authGuard, ensureBlogGuard] },
  { path: 'site/:blogId', component: SitePageComponent },
  { path: 'site/:blogId/:slug', component: PostDetailComponent },
  { path: 'preview/:blogId/:postId', component: PreviewPageComponent, canActivate: [authGuard, ensureBlogGuard] },
  { path: 'posts', component: PostsListComponent, canActivate: [authGuard, ensureBlogGuard] },
  { path: 'posts/edit/:postId', component: NewPostComponent, canActivate: [authGuard, ensureBlogGuard] },
  { path: 'posts/new', component: NewPostComponent, canActivate: [authGuard, ensureBlogGuard] },
  { path: ':hostSlug/:slug', component: PublicHostComponent },
  { path: ':slug', component: PublicHostComponent },
  { path: '**', redirectTo: '' }
];
