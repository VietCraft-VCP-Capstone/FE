import React from 'react';

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const navButton = (disabled: boolean): React.CSSProperties => ({
  padding: '8px 16px',
  borderRadius: 20,
  border: '1px solid #e7e5e4',
  backgroundColor: '#ffffff',
  color: disabled ? '#a8a29e' : '#1c1917',
  fontSize: 13,
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.15s ease'
});

export const SearchPagination: React.FC<SearchPaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const go = (page: number) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 36 }}>
      <button type="button" onClick={() => go(currentPage - 1)} disabled={currentPage === 1} style={navButton(currentPage === 1)}>
        &larr; Trang trước
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
        if (pNum !== 1 && pNum !== totalPages && Math.abs(pNum - currentPage) > 2) {
          return Math.abs(pNum - currentPage) === 3 ? <span key={pNum} style={{ color: '#a8a29e', padding: '0 4px' }}>...</span> : null;
        }
        const isActive = pNum === currentPage;
        return (
          <button
            key={pNum}
            type="button"
            onClick={() => go(pNum)}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: `1px solid ${isActive ? '#007700' : '#e7e5e4'}`,
              backgroundColor: isActive ? '#007700' : '#ffffff',
              color: isActive ? '#ffffff' : '#1c1917',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            {pNum}
          </button>
        );
      })}

      <button type="button" onClick={() => go(currentPage + 1)} disabled={currentPage === totalPages} style={navButton(currentPage === totalPages)}>
        Trang sau &rarr;
      </button>
    </div>
  );
};
