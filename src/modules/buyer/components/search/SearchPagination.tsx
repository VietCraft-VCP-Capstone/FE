import React from 'react';

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const SearchPagination: React.FC<SearchPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginTop: 36
    }}>
      <button
        type="button"
        onClick={() => {
          onPageChange(Math.max(currentPage - 1, 1));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        disabled={currentPage === 1}
        style={{
          padding: '8px 16px',
          borderRadius: 20,
          border: '1px solid #e7e5e4',
          backgroundColor: '#ffffff',
          color: currentPage === 1 ? '#a8a29e' : '#1c1917',
          fontSize: 13,
          fontWeight: 700,
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        &larr; Trang trước
      </button>

      {/* Page numbers */}
      {[...Array(totalPages)].map((_, i) => {
        const pNum = i + 1;
        if (
          pNum === 1 ||
          pNum === totalPages ||
          (pNum >= currentPage - 2 && pNum <= currentPage + 2)
        ) {
          const isActive = pNum === currentPage;
          return (
            <button
              key={pNum}
              type="button"
              onClick={() => {
                onPageChange(pNum);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: isActive ? '1px solid #007700' : '1px solid #e7e5e4',
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
        }
        if (pNum === currentPage - 3 || pNum === currentPage + 3) {
          return <span key={pNum} style={{ color: '#a8a29e', padding: '0 4px' }}>...</span>;
        }
        return null;
      })}

      <button
        type="button"
        onClick={() => {
          onPageChange(Math.min(currentPage + 1, totalPages));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        disabled={currentPage === totalPages}
        style={{
          padding: '8px 16px',
          borderRadius: 20,
          border: '1px solid #e7e5e4',
          backgroundColor: '#ffffff',
          color: currentPage === totalPages ? '#a8a29e' : '#1c1917',
          fontSize: 13,
          fontWeight: 700,
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        Trang sau &rarr;
      </button>
    </div>
  );
};
