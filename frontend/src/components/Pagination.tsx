export function Pagination({ page, totalPages, disabled, onChange }: {
  page: number; totalPages: number; disabled?: boolean; onChange: (page: number) => void
}) {
  return <nav className="pagination" aria-label="Phân trang">
    <button type="button" className="text-button" disabled={disabled || page === 0} onClick={() => onChange(page - 1)}>Trang trước</button>
    <span aria-live="polite">Trang {page + 1} / {Math.max(1, totalPages)}</span>
    <button type="button" className="text-button" disabled={disabled || page + 1 >= totalPages} onClick={() => onChange(page + 1)}>Trang sau</button>
  </nav>
}
