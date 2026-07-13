import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { CmsService } from '../services/cms.service';

export const ensureBlogGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const cms = inject(CmsService);
  const router = inject(Router);

  if (cms.activeBlogSignal()) {
    return true;
  }

  const blogId = route.paramMap.get('blogId');
  if (blogId) {
    // attempt to set active blog from route
    cms.setActiveBlogById(blogId);
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
