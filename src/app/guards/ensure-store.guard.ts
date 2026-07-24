import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { CmsService } from '../services/cms.service';

export const ensureStoreGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const cms = inject(CmsService);
  const router = inject(Router);

  if (cms.activeStoreSignal()) {
    return true;
  }

  const storeId = route.paramMap.get('storeId');
  if (storeId) {
    // attempt to set active store from route
    cms.setActiveBlogById(storeId);
    return true;
  }

  // Allow the dashboard landing page even when no store is selected yet.
  if (route.routeConfig?.path === 'dashboard') {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
