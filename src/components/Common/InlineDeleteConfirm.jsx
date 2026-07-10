export default function InlineDeleteConfirm({ onConfirm, onCancel, className = '' }) {
  return (
    <div
      className={`ml-auto flex shrink-0 items-center gap-1 rounded-xl border border-red-500/35 bg-red-500/10 px-2 py-1.5 ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      <span className="text-[12px] font-black text-white">Sil?</span>
      <button
        type="button"
        onClick={onConfirm}
        className="rounded-md bg-red-500 px-1.5 py-0.5 text-[12px] font-black text-white"
      >
        Evet
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md bg-dark-600 px-1.5 py-0.5 text-[12px] font-bold text-gray-200"
      >
        Hayır
      </button>
    </div>
  )
}
