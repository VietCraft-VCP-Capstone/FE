import { useEffect } from 'react';

export interface SeoMetaProps {
  title?: string;
  description?: string;
  ogImage?: string;
  schema?: Record<string, unknown>;
}

/**
 * Component hỗ trợ Dynamic SEO cho React SPA:
 * - Cập nhật document.title và meta[name="description"]
 * - Cập nhật OpenGraph tag cho chia sẻ mạng xã hội
 * - Nhúng Schema.org Structured Data (JSON-LD) cho Google Rich Results
 */
export function SeoMeta({ title, description, ogImage, schema }: SeoMetaProps) {
  useEffect(() => {
    const prevTitle = document.title;

    // 1. Cập nhật Title
    if (title) {
      document.title = title.includes('VietCraft') ? title : `${title} · VietCraft`;
    }

    // 2. Cập nhật Description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    // 3. Cập nhật OpenGraph Image
    if (ogImage) {
      let ogImgTag = document.querySelector('meta[property="og:image"]');
      if (!ogImgTag) {
        ogImgTag = document.createElement('meta');
        ogImgTag.setAttribute('property', 'og:image');
        document.head.appendChild(ogImgTag);
      }
      ogImgTag.setAttribute('content', ogImage);
    }

    // 4. Nhúng Schema.org JSON-LD cho Google Search Crawler
    let scriptTag: HTMLScriptElement | null = null;
    if (schema) {
      scriptTag = document.createElement('script');
      scriptTag.type = 'application/ld+json';
      scriptTag.text = JSON.stringify(schema);
      document.head.appendChild(scriptTag);
    }

    return () => {
      if (prevTitle) {
        document.title = prevTitle;
      }
      if (scriptTag && document.head.contains(scriptTag)) {
        document.head.removeChild(scriptTag);
      }
    };
  }, [title, description, ogImage, schema]);

  return null;
}
