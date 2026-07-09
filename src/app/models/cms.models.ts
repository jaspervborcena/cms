export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
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
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
}

export interface Blog {
  id: string;
  name: string;
  description?: string;
  category?: string;
  ownerUid?: string | null;
  createdAt?: string;
  theme?: string;
  domain?: string;
}
