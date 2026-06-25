import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

// Sinh danh sách số trang để hiển thị, chèn '…' ở các quãng bị rút gọn.
function buildPages(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | 'ellipsis')[] = [1];
  const left = Math.max(2, page - 1);
  const right = Math.min(totalPages - 1, page + 1);
  if (left > 2) pages.push('ellipsis');
  for (let p = left; p <= right; p += 1) pages.push(p);
  if (right < totalPages - 1) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}

export function Pagination({ page, totalPages, total, pageSize, onChange }: PaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = buildPages(page, totalPages);

  return (
    <div className="pagination">
      <span className="pagination-info">
        Hiển thị <strong>{from}–{to}</strong> trong <strong>{total}</strong>
      </span>

      <div className="pagination-controls">
        <button
          type="button"
          className="page-btn"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Trang trước"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, index) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="page-ellipsis">…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`page-btn${p === page ? ' active' : ''}`}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          className="page-btn"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Trang sau"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
