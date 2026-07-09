import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CmsService } from './cms.service';
import { AuthService } from './auth.service';

describe('CmsService public URL helpers', () => {
  let service: CmsService;
  const originalLocation = window.location;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CmsService,
        { provide: AuthService, useValue: { authSignal: signal(null) } }
      ]
    });
    service = TestBed.inject(CmsService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation
    });
  });

  it('uses the generated public subdomain when the app is hosted on a remote domain', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        hostname: 'app.example.com',
        host: 'app.example.com',
        origin: 'https://app.example.com',
        protocol: 'https:',
        port: '',
        href: 'https://app.example.com/'
      }
    });

    const blog = { id: 'blog-123', name: 'Demo blog' } as any;

    expect(service.getPublicSiteUrl(blog)).toBe('https://www.blog-123.cms.tovrika.com');
    expect(service.getPublicPostUrl(blog, 'hello-world')).toBe('https://www.blog-123.cms.tovrika.com/hello-world');
  });
});
