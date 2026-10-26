import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsService } from '../../product/services/productsService';
import { SuggestResult } from '../../product/types/product';

const EMPTY: SuggestResult = { keywords: [], shops: [], categories: [] };

export function useSearchSuggest(search: string, setSearch: (value: string) => void) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestResult>(EMPTY);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setSuggestions(EMPTY);
      setIsSuggestLoading(false);
      return;
    }
    setIsSuggestLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (isComposingRef.current) return setIsSuggestLoading(false);
      productsService.suggest(q, controller.signal).then((res) => {
        if (controller.signal.aborted) return;
        setSuggestions(res);
        setIsSuggestLoading(false);
      });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const onExecuteSearch = (keyword = search) => {
    const kw = keyword.trim();
    close();
    navigate(kw ? `/search?q=${encodeURIComponent(kw)}` : '/search');
  };

  return {
    containerRef,
    onExecuteSearch,
    inputProps: {
      value: search,
      onCompositionStart: () => { isComposingRef.current = true; },
      onCompositionEnd: () => { isComposingRef.current = false; },
      onChange: (e: ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); open(); },
      onFocus: open,
      onClick: open,
      onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); onExecuteSearch(); }
        else if (e.key === 'Escape') close();
      },
    },
    popoverProps: { isOpen, search, setSearch, isSuggestLoading, suggestions, onExecuteSearch, onClose: close },
  };
}
