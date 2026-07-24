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

    const store = { id: 'store-123', name: 'Demo store', slug: 'demo-store' } as any;

    expect(service.getPublicSiteUrl(store)).toBe('https://www.demo-store.gameoffortunes.com');
    expect(service.getPublicPostUrl(store, 'hello-world')).toBe('https://www.demo-store.gameoffortunes.com/hello-world');
  });

  it('uses the generated store id as the slug when no slug is provided', async () => {
    const store = await service.createStore({ name: 'Demo store' });

    expect(store.slug).toBeDefined();
    expect(store.slug).toContain('local-');
    expect(store.slug).toBe(store.id);
  });

  it('treats a simple custom domain value as a store subdomain in production', () => {
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

    const store = { id: 'store-123', name: 'Demo store', slug: 'demo-store', domain: 'jasperblogtest' } as any;

    expect(service.getPublicSiteUrl(store)).toBe('https://jasperblogtest.gameoffortunes.com');
    expect(service.getPublicPostUrl(store, 'hello-world')).toBe('https://jasperblogtest.gameoffortunes.com/hello-world');
  });

  it('uses the root public domain for a bare slug store domain', () => {
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

    const store = { id: 'store-123', name: 'Demo store', slug: 'demo-store', domain: 'hello' } as any;

    expect(service.getPublicSiteUrl(store)).toBe('https://hello.gameoffortunes.com');
    expect(service.getPublicPostUrl(store, 'popo')).toBe('https://hello.gameoffortunes.com/popo');
  });
});
