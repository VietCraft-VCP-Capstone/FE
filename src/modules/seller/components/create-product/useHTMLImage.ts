import { useState, useEffect } from 'react';

const API_ORIGIN = 'http://localhost:8080';

export const abs = (u: string) => {
    if (!u) return '';
    if (u.startsWith('http')) return u;
    if (u.startsWith('/images/')) return u;
    return `${API_ORIGIN}${u}`;
};

export function useHTMLImage(src?: string) {
    const [img, setImg] = useState<HTMLImageElement | null>(null);
    useEffect(() => {
        if (!src) { setImg(null); return; }
        const url = abs(src);
        const i = new window.Image();
        if (url.startsWith('http')) {
            i.crossOrigin = 'anonymous';
        }
        i.onload = () => setImg(i);
        i.onerror = () => {
            const fallback = new window.Image();
            fallback.onload = () => setImg(fallback);
            fallback.src = url;
        };
        i.src = url;
    }, [src]);
    return img;
}

export default useHTMLImage;
