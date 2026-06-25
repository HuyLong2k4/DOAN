import { useEffect, useMemo, useState } from 'react';

interface UsePaginationOptions {
  pageSize?: number;
  /** Khi giá trị này đổi (ví dụ: bộ lọc/từ khoá tìm kiếm), tự quay về trang 1. */
  resetKey?: unknown;
}

/**
 * Phân trang phía client cho một mảng đã lọc sẵn. Trả về phần dữ liệu của trang
 * hiện tại cùng thông tin để render thanh phân trang.
 */
export function usePagination<T>(items: T[], options: UsePaginationOptions = {}) {
  const pageSize = options.pageSize ?? 10;
  const { resetKey } = options;
  const [page, setPage] = useState(1);

  // Đổi bộ lọc → về trang 1.
  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Khi số trang giảm (dữ liệu ít đi), kẹp trang hiện tại về vùng hợp lệ.
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return { page, setPage, pageSize, total, totalPages, pageItems };
}
