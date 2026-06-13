import EditableDropdownPill from '../EditableDropdownPill'
import { LIST_PILL_CLASS } from '../Common/ListDeleteConfirmPanel'

export default function RepresentativeEditor({
  record,
  onPatch,
  optionLists,
  updateOptionList,
  activeMenu,
  setActiveMenu,
  openKey = 'document-representative',
}) {
  const selectedRepresentative = optionLists.representative.find((option) => option.label === record.owner)

  return (
    <div>
      <h2 className="mb-3 text-base font-bold text-white">Müşteri Temsilcisi</h2>
      <div className="rounded-2xl border border-dark-500/40 bg-dark-800/70 p-3">
        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Temsilci</p>
        <EditableDropdownPill
          value={record.owner || ''}
          options={optionLists.representative}
          onOptionsChange={(next) => updateOptionList('representative', next)}
          buttonClassName={LIST_PILL_CLASS}
          openKey={openKey}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          onChange={(value) => onPatch({ owner: value })}
        />
        {selectedRepresentative && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-dark-500/35 bg-dark-700/35 px-3 py-2.5">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${selectedRepresentative.color}`} />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Seçili Temsilci</p>
              <p className="truncate text-sm font-bold text-white">{selectedRepresentative.label}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
