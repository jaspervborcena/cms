import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ensureStoreGuard } from './ensure-store.guard';
import { CmsService } from '../services/cms.service';

describe('ensureStoreGuard', () => {
  let cmsService: Partial<CmsService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    cmsService = {
      activeStoreSignal: signal(null),
      setActiveBlogById: jasmine.createSpy('setActiveBlogById')
    };

    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: CmsService, useValue: cmsService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('allows access to the dashboard when no store is selected yet', () => {
    const result = TestBed.runInInjectionContext(() => ensureStoreGuard({ paramMap: { get: () => null } } as any, {} as any));

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
