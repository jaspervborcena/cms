import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { AuthComponent } from './pages/auth/auth.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { OnboardingComponent } from './pages/onboarding/onboarding.component';
import { PreviewPageComponent } from './pages/preview-page/preview-page.component';
import { SitePageComponent } from './pages/site-page/site-page.component';
import { authGuard } from './guards/auth.guard';
import { ensureBlogGuard } from './guards/ensure-blog.guard';
import { NewPostComponent } from './pages/new-post/new-post.component';
import { PostsListComponent } from './pages/posts-list/posts-list.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: AuthComponent },
  { path: 'register', component: AuthComponent },
  { path: 'onboarding', component: OnboardingComponent, canActivate: [authGuard] },
  { path: 'preview/:blogId/:postId', component: PreviewPageComponent, canActivate: [authGuard] },
  { path: 'site/:blogId', component: SitePageComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard, ensureBlogGuard] },
  { path: 'dashboard/:blogId', component: DashboardComponent, canActivate: [authGuard, ensureBlogGuard] },
  { path: 'posts', component: PostsListComponent, canActivate: [authGuard, ensureBlogGuard] },
  { path: 'posts/new', component: NewPostComponent, canActivate: [authGuard, ensureBlogGuard] },
  { path: '**', redirectTo: '' }
];
