import { useEffect } from 'react';

export interface SeoMetaProps {
  title?: string;
  description?: string;
  ogImage?: string;
  schema?: Record<string, unknown>;
  noindex?: boolean;
}

// Returns the tag only when newly created, so cleanup removes just what this component added.
const upsertMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  const created = !el;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return created ? el : null;
};

export function SeoMeta({ title, description, ogImage, schema, noindex }: SeoMetaProps) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title.includes('VietCraft') ? title : `${title} · VietCraft`;
    if (description) upsertMeta('name', 'description', description);
    if (ogImage) upsertMeta('property', 'og:image', ogImage);
    const robots = noindex ? upsertMeta('name', 'robots', 'noindex, follow') : null;

    let script: HTMLScriptElement | null = null;
    if (schema) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => {
      if (prevTitle) document.title = prevTitle;
      script?.remove();
      robots?.remove();
    };
  }, [title, description, ogImage, schema, noindex]);

  return null;
}
