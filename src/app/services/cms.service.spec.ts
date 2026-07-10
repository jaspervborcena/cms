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

    const blog = { id: 'blog-123', name: 'Demo blog', slug: 'demo-blog' } as any;

    expect(service.getPublicSiteUrl(blog)).toBe('https://www.demo-blog.gameoffortunes.com');
    expect(service.getPublicPostUrl(blog, 'hello-world')).toBe('https://www.demo-blog.gameoffortunes.com/hello-world');
  });

  it('uses the generated blog id as the slug when no slug is provided', async () => {
    const blog = await service.createBlog({ name: 'Demo blog' });

    expect(blog.slug).toBeDefined();
    expect(blog.slug).toContain('local-');
    expect(blog.slug).toBe(blog.id);
  });

  it('treats a simple custom domain value as a blog subdomain in production', () => {
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

    const blog = { id: 'blog-123', name: 'Demo blog', slug: 'demo-blog', domain: 'jasperblogtest' } as any;

    expect(service.getPublicSiteUrl(blog)).toBe('https://jasperblogtest.gameoffortunes.com');
    expect(service.getPublicPostUrl(blog, 'hello-world')).toBe('https://jasperblogtest.gameoffortunes.com/hello-world');
  });

  it('uses the root public domain for a bare slug blog domain', () => {
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

    const blog = { id: 'blog-123', name: 'Demo blog', slug: 'demo-blog', domain: 'hello' } as any;

    expect(service.getPublicSiteUrl(blog)).toBe('https://hello.gameoffortunes.com');
    expect(service.getPublicPostUrl(blog, 'popo')).toBe('https://hello.gameoffortunes.com/popo');
  });
});
