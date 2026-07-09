import { Injectable, computed, inject, signal } from '@angular/core';
import { collection, collectionData, Firestore, orderBy, query, where, getDocs, addDoc, setDoc, doc, getDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Storage, getDownloadURL, ref, uploadString } from '@angular/fire/storage';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Page, Post } from '../models/cms.models';
import { Blog } from '../models/cms.models';
import { AuthService } from './auth.service';

const mockPosts: Post[] = [
  {
    id: 'post-1',
    title: 'Launching the Tovrika CMS starter',
    slug: 'launching-the-tovrika-cms-starter',
    excerpt: 'A quick look at the structure for a modern Angular and Firebase-powered editorial experience.',
    content: 'This starter app combines Angular signals, Firebase Firestore, and a classic editorial layout for posts, pages, and site widgets.',
    category: 'Product',
    status: 'published',
    views: 432,
    createdAt: '2026-07-08T09:30:00.000Z',
    publishedAt: '2026-07-08T10:00:00.000Z'
  },
  {
    id: 'post-2',
    title: 'Designing content workflows for growth',
    slug: 'designing-content-workflows-for-growth',
    excerpt: 'Editorial teams need a clear rhythm of drafting, review, and publication.',
    content: 'A CMS should feel calm and composable so editors can focus on content rather than wrangling UI.',
    category: 'Workflow',
    status: 'published',
    views: 281,
    createdAt: '2026-07-07T15:50:00.000Z',
    publishedAt: '2026-07-07T16:30:00.000Z'
  },
  {
    id: 'post-3',
    title: 'Using signals for instant UI updates',
    slug: 'using-signals-for-instant-ui-updates',
    excerpt: 'Signals help the sidebar and post lists react instantly as content changes.',
    content: 'Signals keep your local state simple and predictable while Firebase supplies the content source.',
    category: 'Engineering',
    status: 'published',
    views: 198,
    createdAt: '2026-07-06T08:45:00.000Z',
    publishedAt: '2026-07-06T09:15:00.000Z'
  }
];

const mockPages: Page[] = [
  {
    id: 'page-about',
    title: 'About',
    slug: 'about',
    excerpt: 'Learn more about the editorial platform.',
    content: 'This page is designed to host a simple company or project story with a polished layout.'
  },
  {
    id: 'page-contact',
    title: 'Contact',
    slug: 'contact',
    excerpt: 'Reach the team behind the CMS.',
    content: 'Use this page to surface your preferred contact channels and support details.'
  }
];

@Injectable({ providedIn: 'root' })
export class CmsService {
  private readonly firestore = inject(Firestore, { optional: true });
  private readonly storage = inject(Storage, { optional: true });
  private readonly auth = inject(AuthService);
  readonly postsSignal = signal<Post[]>([]);
  readonly pagesSignal = signal<Page[]>([]);
  readonly blogsSignal = signal<Blog[]>([]);
  readonly activeBlogSignal = signal<Blog | null>(this.readStoredActiveBlog());
  readonly draftSignal = signal<Post | null>(null);
  readonly previewSignal = signal<Post | null>(null);
  private readonly localPostsKey = 'cms-local-posts';
  private readonly localPagesKey = 'cms-local-pages';
  private readonly defaultThemeId = 'default';
  readonly filteredPostsSignal = computed(() => {
    const blog = this.activeBlogSignal();
    if (!blog) return [] as Post[];
    return this.postsSignal().filter((p) => p.blogId === blog.id);
  });
  readonly publishedPostsSignal = computed(() => {
    const blog = this.activeBlogSignal();
    if (!blog) return [] as Post[];
    return this.postsSignal().filter((p) => p.blogId === blog.id && p.status === 'published');
  });
  readonly draftPostsSignal = computed(() => {
    const blog = this.activeBlogSignal();
    if (!blog) return [] as Post[];
    return this.postsSignal().filter((p) => p.blogId === blog.id && p.status === 'draft');
  });
  readonly popularPostsSignal = computed(() => [...this.postsSignal()].sort((a, b) => b.views - a.views).slice(0, 3));
  readonly recentPostsSignal = computed(() => [...this.postsSignal()].sort((a, b) => new Date(b.publishedAt ?? b.createdAt ?? '').getTime() - new Date(a.publishedAt ?? a.createdAt ?? '').getTime()).slice(0, 3));

  constructor() {
    this.loadPosts();
    this.loadPages();
    this.loadBlogs();
  }

  private loadBlogs(): void {
    if (!environment.firebase.projectId || !this.firestore) {
      const existing = this.activeBlogSignal();
      // ensure slug exists for local blog
      if (existing && !existing.slug) {
        const withSlug = { ...existing, slug: this.slugify(existing.name) };
        this.activeBlogSignal.set(withSlug);
        this.blogsSignal.set([withSlug]);
      } else {
        this.blogsSignal.set(existing ? [existing] : []);
      }
      return;
    }

    const blogsCollection = collection(this.firestore, 'blogs');
    collectionData(query(blogsCollection, orderBy('createdAt', 'desc')), { idField: 'id' })
      .pipe(
        map((items: Array<Record<string, unknown>>) => items.map((item) => ({
          id: String(item['id'] ?? ''),
          uid: item['uid'] ? String(item['uid']) : undefined,
          name: String(item['name'] ?? 'Untitled blog'),
          slug: item['slug'] ? String(item['slug']) : this.slugify(String(item['name'] ?? '')),
          description: String(item['description'] ?? ''),
          category: String(item['category'] ?? ''),
          ownerUid: item['ownerUid'] ? String(item['ownerUid']) : null,
          createdAt: String(item['createdAt'] ?? ''),
          theme: item['theme'] ? String(item['theme']) : this.defaultThemeId,
          domain: item['domain'] ? String(item['domain']) : undefined
        } as Blog))),
        catchError(() => of([] as Blog[]))
      )
      .subscribe((blogs) => this.blogsSignal.set(blogs));
  }

  async createBlog(data: { name: string; description?: string; category?: string; ownerUid?: string | null; slug?: string | null }): Promise<Blog> {
    const now = new Date().toISOString();
    const requestedSlug = (data.slug ?? '').trim();
    const blog: Omit<Blog, 'id'> = {
      uid: this.auth.authSignal()?.uid ?? undefined,
      name: data.name,
      slug: requestedSlug ? this.slugify(requestedSlug) : undefined,
      description: data.description,
      category: data.category,
      ownerUid: data.ownerUid ?? null,
      createdAt: now,
      updatedAt: now,
      theme: 'default'
    };

    if (!environment.firebase.projectId || !this.firestore) {
      const localBlogId = `local-${Math.random().toString(36).slice(2,9)}`;
      const localBlog: Blog = { ...blog, id: localBlogId, slug: blog.slug ?? localBlogId } as Blog;
      this.activeBlogSignal.set(localBlog);
      this.persistActiveBlog(localBlog);
      const current = this.blogsSignal();
      this.blogsSignal.set([...current, localBlog]);
      return localBlog;
    }

    const blogsCollection = collection(this.firestore, 'blogs');
    const docRef = await addDoc(blogsCollection, blog as any);
    const newBlog: Blog = { ...(blog as Blog), id: docRef.id, slug: blog.slug ?? docRef.id };
    await setDoc(docRef, { slug: newBlog.slug }, { merge: true });
    this.activeBlogSignal.set(newBlog);
    this.persistActiveBlog(newBlog);
    const current = this.blogsSignal();
    this.blogsSignal.set([...current, newBlog]);
    return newBlog;
  }

  async updateBlog(blogId: string, data: Partial<Pick<Blog, 'name' | 'slug' | 'description' | 'category' | 'theme' | 'domain' | 'ownerUid'>>): Promise<Blog | null> {
    const blog = this.blogsSignal().find((item) => item.id === blogId);
    if (!blog) return null;

    const updatedBlog: Blog = {
      ...blog,
      ...data,
      slug: data.slug ? this.slugify(data.slug) : blog.slug,
      theme: data.theme ?? blog.theme ?? this.defaultThemeId,
      updatedAt: new Date().toISOString()
    };

    if (!environment.firebase.projectId || !this.firestore) {
      const updatedBlogs = this.blogsSignal().map((item) => (item.id === blogId ? updatedBlog : item));
      this.blogsSignal.set(updatedBlogs);
      if (this.activeBlogSignal()?.id === blogId) {
        this.activeBlogSignal.set(updatedBlog);
        this.persistActiveBlog(updatedBlog);
      }
      return updatedBlog;
    }

    const blogDoc = doc(this.firestore, `blogs/${blogId}`);
    await updateDoc(blogDoc, updatedBlog as any);
    const updatedBlogs = this.blogsSignal().map((item) => (item.id === blogId ? updatedBlog : item));
    this.blogsSignal.set(updatedBlogs);
    if (this.activeBlogSignal()?.id === blogId) {
      this.activeBlogSignal.set(updatedBlog);
      this.persistActiveBlog(updatedBlog);
    }
    return updatedBlog;
  }

  async deleteBlog(blogId: string): Promise<void> {
    if (!environment.firebase.projectId || !this.firestore) {
      const remaining = this.blogsSignal().filter((item) => item.id !== blogId);
      this.blogsSignal.set(remaining);
      if (this.activeBlogSignal()?.id === blogId) {
        this.activeBlogSignal.set(null);
        this.persistActiveBlog(null);
      }
      return;
    }

    const blogDoc = doc(this.firestore, `blogs/${blogId}`);
    await deleteDoc(blogDoc);
    const remaining = this.blogsSignal().filter((item) => item.id !== blogId);
    this.blogsSignal.set(remaining);
    if (this.activeBlogSignal()?.id === blogId) {
      this.activeBlogSignal.set(null);
      this.persistActiveBlog(null);
    }
  }

  setActiveBlogById(blogId: string): void {
    const found = this.blogsSignal().find((b) => b.id === blogId);
    if (found) {
      this.activeBlogSignal.set(found);
      this.persistActiveBlog(found);
      // load posts for the newly active blog
      this.loadPostsForBlog(found.id);
      this.ensureBlogHasTheme(found.id).catch(() => {});
      return;
    }

    // If not found locally, attempt to load from Firestore
    if (!this.firestore) {
      return;
    }

    const blogDocRef = doc(this.firestore, `blogs/${blogId}`);
    getDoc(blogDocRef).then((snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data() as Record<string, unknown>;
      const blog: Blog = {
        id: snapshot.id,
        uid: data['uid'] ? String(data['uid']) : undefined,
        name: String(data['name'] ?? 'Untitled blog'),
        slug: data['slug'] ? String(data['slug']) : this.slugify(String(data['name'] ?? '')),
        description: data['description'] ? String(data['description']) : undefined,
        category: data['category'] ? String(data['category']) : undefined,
        ownerUid: data['ownerUid'] ? String(data['ownerUid']) : null,
        createdAt: data['createdAt'] ? String(data['createdAt']) : undefined,
        updatedAt: data['updatedAt'] ? String(data['updatedAt']) : undefined,
        theme: data['theme'] ? String(data['theme']) : this.defaultThemeId,
        domain: data['domain'] ? String(data['domain']) : undefined
      } as Blog;

      this.activeBlogSignal.set(blog);
      this.persistActiveBlog(blog);
      const current = this.blogsSignal();
      this.blogsSignal.set([...current, blog]);
      this.loadPostsForBlog(blog.id);
      this.ensureBlogHasTheme(blog.id).catch(() => {});
    }).catch(() => {});
  }

  private async loadPostsForBlog(blogId: string): Promise<void> {
    if (!this.firestore) {
      // local mode: filter existing posts by blogId
      const localPosts = this.readLocalPosts();
      this.postsSignal.set(localPosts.filter((p) => p.blogId === blogId));
      return;
    }

    const postsCollection = collection(this.firestore, `blogs/${blogId}/posts`);
    collectionData(query(postsCollection, orderBy('publishedAt', 'desc')), { idField: 'id' })
      .pipe(
        map((items: Array<Record<string, unknown>>) => items.map((item) => ({ ...this.normalizePost(item), blogId } as Post)) ),
        catchError(() => of([] as Post[]))
      )
      .subscribe((posts) => this.postsSignal.set(posts));
  }

  async createPost(blogId: string, data: { title: string; excerpt?: string; content?: string; category?: string; status?: 'draft' | 'published' }): Promise<Post> {
    const now = new Date().toISOString();
    const status = data.status ?? 'draft';
    await this.ensureBlogHasTheme(blogId);

    const postMeta = {
      uid: this.auth.authSignal()?.uid ?? undefined,
      title: data.title,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: data.excerpt ?? '',
      category: data.category ?? 'Uncategorized',
      blogId,
      status,
      views: 0,
      createdAt: now,
      publishedAt: status === 'published' ? now : undefined
    };

    if (!environment.firebase.projectId || !this.firestore) {
      const localPost: Post = { ...(postMeta as Post), id: `local-post-${Math.random().toString(36).slice(2,9)}`, content: data.content ?? '' };
      const updatedPosts = [localPost, ...this.postsSignal()];
      this.postsSignal.set(updatedPosts);
      this.saveLocalPosts(updatedPosts);
      return localPost;
    }

    const postsCollection = collection(this.firestore, `blogs/${blogId}/posts`);
    const docRef = await addDoc(postsCollection, postMeta as any);
    let contentUrl: string | undefined = undefined;
    const content = data.content ?? '';
    if (this.storage) {
      contentUrl = await this.uploadPostContent(blogId, docRef.id, content);
      if (contentUrl) {
        const postDoc = doc(this.firestore, `blogs/${blogId}/posts/${docRef.id}`);
        await updateDoc(postDoc, { contentUrl } as any);
      }
    }

    const newPost: Post = { ...(postMeta as Post), id: docRef.id, content, contentUrl };
    this.postsSignal.set([newPost, ...this.postsSignal()]);
    return newPost;
  }

  async updatePost(blogId: string, postId: string, data: Partial<Pick<Post, 'title' | 'excerpt' | 'content' | 'category' | 'status' | 'publishedAt'>>): Promise<Post | null> {
    const now = new Date().toISOString();
    const post = this.postsSignal().find((item) => item.id === postId && item.blogId === blogId);
    if (!post) return null;

    const updated: Post = {
      ...post,
      ...data,
      publishedAt: data.status === 'published' ? data.publishedAt ?? now : post.publishedAt,
      createdAt: post.createdAt ?? now,
      content: data.content ?? post.content,
      contentUrl: post.contentUrl
    };

    if (data.content !== undefined && this.storage) {
      const content = data.content ?? '';
      updated.contentUrl = await this.uploadPostContent(blogId, postId, content) ?? post.contentUrl;
    }

    if (!environment.firebase.projectId || !this.firestore) {
      const updatedPosts = this.postsSignal().map((item) => (item.id === postId ? updated : item));
      this.postsSignal.set(updatedPosts);
      this.saveLocalPosts(updatedPosts);
      return updated;
    }

    const postDoc = doc(this.firestore, `blogs/${blogId}/posts/${postId}`);
    await updateDoc(postDoc, {
      title: updated.title,
      excerpt: updated.excerpt,
      category: updated.category,
      status: updated.status,
      publishedAt: updated.publishedAt,
      contentUrl: updated.contentUrl
    } as any);
    this.postsSignal.set(this.postsSignal().map((item) => (item.id === postId ? updated : item)));
    return updated;
  }

  async deletePost(blogId: string, postId: string): Promise<void> {
    if (!environment.firebase.projectId || !this.firestore) {
      const updatedPosts = this.postsSignal().filter((item) => item.id !== postId);
      this.postsSignal.set(updatedPosts);
      this.saveLocalPosts(updatedPosts);
      return;
    }

    const postDoc = doc(this.firestore, `blogs/${blogId}/posts/${postId}`);
    await deleteDoc(postDoc);
    this.postsSignal.set(this.postsSignal().filter((item) => item.id !== postId));
  }

  async publishPost(blogId: string, postId: string): Promise<Post | null> {
    return this.updatePost(blogId, postId, { status: 'published', publishedAt: new Date().toISOString() });
  }

  async loadPreviewPost(blogId: string, postId: string): Promise<Post | null> {
    const existing = this.postsSignal().find((item) => item.id === postId && item.blogId === blogId);
    if (existing) {
      const hydrated = await this.hydratePostContent(existing);
      this.previewSignal.set(hydrated);
      return hydrated;
    }

    if (!this.firestore) {
      const localPosts = this.readLocalPosts();
      const fallback = localPosts.find((item) => item.id === postId && item.blogId === blogId) ?? null;
      if (fallback) {
        this.previewSignal.set(fallback);
      }
      return fallback;
    }
    const postDoc = doc(this.firestore, `blogs/${blogId}/posts/${postId}`);
    const snapshot = await getDoc(postDoc);
    if (!snapshot.exists()) return null;
    const data = snapshot.data() as Record<string, unknown>;
    const post = await this.hydratePostContent(this.normalizePost({ ...data, id: snapshot.id }));
    this.previewSignal.set(post);
    return post;
  }

  getPostById(blogId: string, postId: string): Post | undefined {
    return this.postsSignal().find((item) => item.id === postId && item.blogId === blogId);
  }

  async loadPostById(blogId: string, postId: string): Promise<Post | null> {
    const existing = this.getPostById(blogId, postId);
    if (existing) {
      const hydrated = await this.hydratePostContent(existing);
      this.postsSignal.set(this.postsSignal().map((item) => (item.id === hydrated.id ? hydrated : item)));
      return hydrated;
    }

    if (!this.firestore) {
      return null;
    }

    const postDoc = doc(this.firestore, `blogs/${blogId}/posts/${postId}`);
    const snapshot = await getDoc(postDoc);
    if (!snapshot.exists()) return null;
    const post = await this.hydratePostContent(this.normalizePost({ ...snapshot.data(), id: snapshot.id }));
    this.postsSignal.set([post, ...this.postsSignal()]);
    return post;
  }

  async loadPostBySlug(blogId: string, slug: string): Promise<Post | null> {
    const existing = this.findPostBySlug(blogId, slug);
    if (existing) {
      const hydrated = await this.hydratePostContent(existing);
      this.postsSignal.set(this.postsSignal().map((item) => (item.id === hydrated.id ? hydrated : item)));
      return hydrated;
    }

    if (!this.firestore) {
      return null;
    }

    const postsCollection = collection(this.firestore, `blogs/${blogId}/posts`);
    const slugQuery = query(postsCollection, where('slug', '==', slug));
    const snapshot = await getDocs(slugQuery);
    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    const post = await this.hydratePostContent(this.normalizePost({ ...docSnap.data(), id: docSnap.id }));
    this.postsSignal.set([post, ...this.postsSignal()]);
    return post;
  }

  findPostBySlug(blogId: string, slug: string): Post | undefined {
    return this.postsSignal().find((item) => item.blogId === blogId && item.slug === slug);
  }

  findBlogByHostSlug(hostSlug: string): Blog | undefined {
    const normalized = hostSlug.toLowerCase();
    // match domain exactly
    const byDomain = this.blogsSignal().find((b) => b.domain && b.domain.replace(/^(https?:\/\/)?/, '').toLowerCase() === normalized);
    if (byDomain) return byDomain;

    // match id directly
    const byId = this.blogsSignal().find((b) => b.id === hostSlug || b.id.toLowerCase() === normalized);
    if (byId) return byId;

    // match explicit slug
    const bySlug = this.blogsSignal().find((b) => (b.slug ? b.slug.toLowerCase() === normalized : false));
    if (bySlug) return bySlug;

    // match slugified name as fallback
    const byName = this.blogsSignal().find((b) => this.slugify(b.name || '') === normalized);
    if (byName) return byName;

    return undefined;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private getPostContentPath(blogId: string, postId: string): string {
    return `blogs/${blogId}/posts/${postId}.html`;
  }

  private async uploadPostContent(blogId: string, postId: string, content: string): Promise<string | undefined> {
    if (!this.storage) {
      return undefined;
    }

    const storageRef = ref(this.storage, this.getPostContentPath(blogId, postId));
    await uploadString(storageRef, content, 'raw', { contentType: 'text/html' });
    return getDownloadURL(storageRef);
  }

  private async loadPostContent(contentUrl: string): Promise<string> {
    const response = await fetch(contentUrl);
    if (!response.ok) {
      return '';
    }
    return await response.text();
  }

  private async hydratePostContent(post: Post): Promise<Post> {
    if (post.content) {
      return post;
    }

    if (!post.contentUrl) {
      return { ...post, content: '' };
    }

    const content = await this.loadPostContent(post.contentUrl).catch(() => '');
    return { ...post, content };
  }

  private async ensureBlogHasTheme(blogId: string): Promise<void> {
    const blog = this.blogsSignal().find((item) => item.id === blogId);
    if (!blog || blog.theme) {
      return;
    }

    await this.setBlogTheme(blogId, this.defaultThemeId);
  }

  private isLocalDevelopmentHost(): boolean {
    const hostname = window.location.hostname.toLowerCase();
    return ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'].includes(hostname);
  }

  private getLocalPreviewUrl(path: string): string {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${window.location.protocol}//127.0.0.1${port}${path}`;
  }

  private getCurrentOrigin(): string {
    return window.location.origin.replace(/\/$/, '');
  }

  private getPublicHostForBlog(blog: Blog): string {
    if (!blog.domain) {
      return this.getCurrentOrigin();
    }

    const host = blog.domain.trim().replace(/^(https?:\/\/)?/, '').replace(/\/$/, '');
    if (!host) {
      return this.getCurrentOrigin();
    }

    const looksLikeFqdn = host.includes('.') || host.includes(':');
    return looksLikeFqdn ? host : this.getCurrentOrigin();
  }

  getPublicSiteUrl(blog: Blog): string {
    if (this.isLocalDevelopmentHost()) {
      return this.getLocalPreviewUrl(`/site/${blog.id}`);
    }

    const host = this.getPublicHostForBlog(blog);
    return host.startsWith('http') ? `${host}/site/${blog.id}` : `https://${host}/site/${blog.id}`;
  }

  getPublicPostUrl(blog: Blog, postSlug: string): string {
    if (this.isLocalDevelopmentHost()) {
      return this.getLocalPreviewUrl(`/site/${blog.id}/${postSlug}`);
    }

    const host = this.getPublicHostForBlog(blog);
    return host.startsWith('http') ? `${host}/site/${blog.id}/${postSlug}` : `https://${host}/site/${blog.id}/${postSlug}`;
  }

  getThemeCssUrl(themeId?: string): string {
    const id = themeId || 'default';
    return `/assets/themes/${id}/theme.css`;
  }

  async loadPageById(pageId: string): Promise<Page | null> {
    const existing = this.pagesSignal().find((item) => item.id === pageId);
    if (existing) {
      return existing;
    }

    if (!this.firestore) {
      const localPages = this.readLocalPages();
      const page = localPages.find((item) => item.id === pageId) ?? null;
      if (page) {
        this.pagesSignal.set([page, ...this.pagesSignal()]);
      }
      return page;
    }

    const pageDoc = doc(this.firestore, `pages/${pageId}`);
    const snapshot = await getDoc(pageDoc);
    if (!snapshot.exists()) return null;

    const page = this.normalizePage({ ...snapshot.data(), id: snapshot.id });
    this.pagesSignal.set([page, ...this.pagesSignal()]);
    return page;
  }

  async createPage(data: { title: string; slug?: string; excerpt?: string; content?: string }): Promise<Page> {
    const now = new Date().toISOString();
    const page: Omit<Page, 'id'> = {
      uid: this.auth.authSignal()?.uid ?? undefined,
      title: data.title,
      slug: data.slug ? this.slugify(data.slug) : this.slugify(data.title),
      excerpt: data.excerpt ?? '',
      content: data.content ?? '',
      createdAt: now,
      updatedAt: now
    };

    if (!environment.firebase.projectId || !this.firestore) {
      const localPage: Page = { ...(page as Page), id: `local-page-${Math.random().toString(36).slice(2,9)}` };
      const updatedPages = [localPage, ...this.pagesSignal()];
      this.pagesSignal.set(updatedPages);
      this.saveLocalPages(updatedPages);
      return localPage;
    }

    const pagesCollection = collection(this.firestore, 'pages');
    const docRef = await addDoc(pagesCollection, page as any);
    const newPage: Page = { ...(page as Page), id: docRef.id };
    this.pagesSignal.set([newPage, ...this.pagesSignal()]);
    return newPage;
  }

  async updatePage(pageId: string, data: Partial<Pick<Page, 'title' | 'slug' | 'excerpt' | 'content'>>): Promise<Page | null> {
    const page = this.pagesSignal().find((item) => item.id === pageId);
    if (!page) return null;

    const updatedPage: Page = {
      ...page,
      ...data,
      slug: data.slug ? this.slugify(data.slug) : page.slug,
      updatedAt: new Date().toISOString()
    };

    if (!environment.firebase.projectId || !this.firestore) {
      const updatedPages = this.pagesSignal().map((item) => (item.id === pageId ? updatedPage : item));
      this.pagesSignal.set(updatedPages);
      this.saveLocalPages(updatedPages);
      return updatedPage;
    }

    const pageDoc = doc(this.firestore, `pages/${pageId}`);
    await updateDoc(pageDoc, updatedPage as any);
    const updatedPages = this.pagesSignal().map((item) => (item.id === pageId ? updatedPage : item));
    this.pagesSignal.set(updatedPages);
    return updatedPage;
  }

  async deletePage(pageId: string): Promise<void> {
    if (!environment.firebase.projectId || !this.firestore) {
      const updatedPages = this.pagesSignal().filter((item) => item.id !== pageId);
      this.pagesSignal.set(updatedPages);
      this.saveLocalPages(updatedPages);
      return;
    }

    const pageDoc = doc(this.firestore, `pages/${pageId}`);
    await deleteDoc(pageDoc);
    this.pagesSignal.set(this.pagesSignal().filter((item) => item.id !== pageId));
  }

  getPageBySlug(slug: string): Page | undefined {
    return this.pagesSignal().find((item) => item.slug === slug);
  }

  async setBlogTheme(blogId: string, theme: string): Promise<void> {
    if (!environment.firebase.projectId || !this.firestore) {
      const current = this.activeBlogSignal();
      if (current && current.id === blogId) {
        const updated = { ...current, theme };
        this.activeBlogSignal.set(updated);
        this.persistActiveBlog(updated);
      }
      return;
    }

    const blogDoc = doc(this.firestore, `blogs/${blogId}`);
    await setDoc(blogDoc, { theme }, { merge: true });
    const current = this.activeBlogSignal();
    if (current && current.id === blogId) {
      const updated = { ...current, theme };
      this.activeBlogSignal.set(updated);
      this.persistActiveBlog(updated);
    }
  }

  async setBlogDomain(blogId: string, domain: string): Promise<void> {
    if (!environment.firebase.projectId || !this.firestore) {
      const current = this.activeBlogSignal();
      if (current && current.id === blogId) {
        const updated = { ...current, domain };
        this.activeBlogSignal.set(updated);
        this.persistActiveBlog(updated);
      }
      return;
    }

    const blogDoc = doc(this.firestore, `blogs/${blogId}`);
    await setDoc(blogDoc, { domain }, { merge: true });
    const current = this.activeBlogSignal();
    if (current && current.id === blogId) {
      const updated = { ...current, domain };
      this.activeBlogSignal.set(updated);
      this.persistActiveBlog(updated);
    }
  }

  private persistActiveBlog(blog: Blog | null): void {
    if (blog) {
      localStorage.setItem('cms-active-blog', JSON.stringify(blog));
      // persist to Firestore under user doc if available
      try {
        const uid = this.auth?.authSignal()?.uid;
        if (uid && this.firestore) {
          const userDoc = doc(this.firestore, `users/${uid}`);
          setDoc(userDoc, { lastActiveBlogId: blog.id }, { merge: true });
        }
      } catch {}
      return;
    }

    localStorage.removeItem('cms-active-blog');
    try {
      const uid = this.auth?.authSignal()?.uid;
      if (uid && this.firestore) {
        const userDoc = doc(this.firestore, `users/${uid}`);
        setDoc(userDoc, { lastActiveBlogId: null }, { merge: true });
      }
    } catch {}
  }

  private readStoredActiveBlog(): Blog | null {
    const v = localStorage.getItem('cms-active-blog');
    if (!v) return null;
    try { return JSON.parse(v) as Blog; } catch { return null; }
  }

  private loadPosts(): void {
    if (!environment.firebase.projectId || !this.firestore) {
      const localPosts = this.readLocalPosts();
      this.postsSignal.set(localPosts.length ? localPosts : mockPosts);
      return;
    }

    const postsCollection = collection(this.firestore, 'posts');
    collectionData(query(postsCollection, orderBy('publishedAt', 'desc')), { idField: 'id' })
      .pipe(
        map((items: Array<Record<string, unknown>>) => items.map((item) => this.normalizePost(item))),
        catchError(() => of(mockPosts))
      )
      .subscribe((posts) => this.postsSignal.set(posts));
  }

  private loadPages(): void {
    if (!environment.firebase.projectId || !this.firestore) {
      const localPages = this.readLocalPages();
      this.pagesSignal.set(localPages.length ? localPages : mockPages);
      return;
    }

    const pagesCollection = collection(this.firestore, 'pages');
    collectionData(query(pagesCollection, orderBy('title', 'asc')), { idField: 'id' })
      .pipe(
        map((items: Array<Record<string, unknown>>) => items.map((item) => this.normalizePage(item))),
        catchError(() => of(mockPages))
      )
      .subscribe((pages) => this.pagesSignal.set(pages));
  }

  private saveLocalPosts(posts: Post[]): void {
    try {
      localStorage.setItem(this.localPostsKey, JSON.stringify(posts));
    } catch {}
  }

  private saveLocalPages(pages: Page[]): void {
    try {
      localStorage.setItem(this.localPagesKey, JSON.stringify(pages));
    } catch {}
  }

  private readLocalPosts(): Post[] {
    const raw = localStorage.getItem(this.localPostsKey);
    if (!raw) return [];
    try {
      const posts = JSON.parse(raw) as Post[];
      return Array.isArray(posts) ? posts : [];
    } catch {
      return [];
    }
  }

  private readLocalPages(): Page[] {
    const raw = localStorage.getItem(this.localPagesKey);
    if (!raw) return [];
    try {
      const pages = JSON.parse(raw) as Page[];
      return Array.isArray(pages) ? pages : [];
    } catch {
      return [];
    }
  }

  private normalizePost(item: Record<string, unknown>): Post {
    return {
      id: String(item['id'] ?? ''),
      uid: item['uid'] ? String(item['uid']) : undefined,
      title: String(item['title'] ?? 'Untitled post'),
      slug: String(item['slug'] ?? 'untitled-post'),
      excerpt: String(item['excerpt'] ?? ''),
      content: String(item['content'] ?? ''),
      contentUrl: item['contentUrl'] ? String(item['contentUrl']) : undefined,
      category: String(item['category'] ?? 'General'),
      status: (item['status'] as 'draft' | 'published') ?? 'draft',
      views: Number(item['views'] ?? 0),
      createdAt: String(item['createdAt'] ?? new Date().toISOString()),
      publishedAt: item['publishedAt'] ? String(item['publishedAt']) : undefined,
      featuredImage: item['featuredImage'] ? String(item['featuredImage']) : undefined,
      blogId: item['blogId'] ? String(item['blogId']) : undefined
    };
  }

  private normalizePage(item: Record<string, unknown>): Page {
    return {
      id: String(item['id'] ?? ''),
      uid: item['uid'] ? String(item['uid']) : undefined,
      title: String(item['title'] ?? 'Untitled page'),
      slug: String(item['slug'] ?? 'untitled-page'),
      excerpt: item['excerpt'] ? String(item['excerpt']) : undefined,
      content: String(item['content'] ?? ''),
      createdAt: item['createdAt'] ? String(item['createdAt']) : undefined,
      updatedAt: item['updatedAt'] ? String(item['updatedAt']) : undefined
    };
  }
}
