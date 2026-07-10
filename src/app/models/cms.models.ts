export interface Post {
  id: string;
  uid?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  contentUrl?: string;
  category: string;
  blogId?: string;
  status: 'draft' | 'published';
  views: number;
  createdAt?: string;
  publishedAt?: string;
  featuredImage?: string;
}

export interface Page {
  id: string;
  uid?: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  contentUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Blog {
  id: string;
  uid?: string;
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  ownerUid?: string | null;
  createdAt?: string;
  updatedAt?: string;
  theme?: string;
  template?: string;
  domain?: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified?: boolean;
  roles?: string[];
  roleId?: number;
  blogsOwned?: string[];
  blogsMember?: string[];
  status?: string;
  createdAt?: string;
  lastLogin?: string;
  updatedAt?: string;
  lastActiveBlogId?: string | null;
}
