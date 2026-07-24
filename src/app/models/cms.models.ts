export interface Post {
  id: string;
  uid?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  contentUrl?: string;
  category: string;
  storeId?: string;
  status: 'draft' | 'published';
  views: number;
  createdAt?: string;  updatedAt?: string;  publishedAt?: string;
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
  storeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  uid?: string;
  name: string;
  slug: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  storeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  url?: string;
  order: number;
}

export interface TemplateConfig {
  topNavPageIds?: string[];
  logoText?: string;
  logoColor?: string;
  secondaryNavItems?: NavigationItem[];
  sidebarPageIds?: string[];
}

export interface Store {
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
  templateConfig?: TemplateConfig;
}

export interface GlobalThemeSettings {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    accent: string;
    muted: string;
    border: string;
  };
  fonts: {
    family: string;
    headingSize: string;
    bodySize: string;
    fontWeight: string;
  };
  spacing: {
    borderRadius: string;
    padding: string;
    gap: string;
  };
  customCss: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified?: boolean;
  roles?: string[];
  roleId?: number;
  storesOwned?: string[];
  storesMember?: string[];
  status?: string;
  createdAt?: string;
  lastLogin?: string;
  updatedAt?: string;
  lastActiveStoreId?: string | null;
}
