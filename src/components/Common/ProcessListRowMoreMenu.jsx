import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button, Dropdown, DropdownItem, DropdownSeparator } from '@bachmain/ui'
import QuoteOrderInlineConfirm from './QuoteOrderInlineConfirm'
import QuoteRecordMetaPanel from './QuoteRecordMetaPanel'

export default function ProcessListRowMoreMenu({
  record,
  extraItems = [],
  onEdit,
  onDelete,
  editLabel = 'Düzenle',
  deleteAriaLabel = 'Kayıt sil',
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <Dropdown
      align="end"
      menuClassName="az customer-filter-dropdown-menu customers-page-menu quote-record-meta-dropdown min-w-[15rem]"
      trigger={
        <Button
          variant="ghost"
          size="iconOnly"
          className="hover:!bg-transparent"
          aria-label="Diğer işlemler"
          onClick={() => setConfirmDelete(false)}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      }
    >
      {({ close }) => (
        <>
          <QuoteRecordMetaPanel quote={record} />
          <DropdownSeparator />
          {extraItems.map((item) => (
            <DropdownItem
              key={item.id || item.label}
              icon={item.icon}
              label={item.label}
              tone={item.tone || 'primary'}
              close={close}
              onClick={item.onClick}
            />
          ))}
          {onEdit ? (
            <DropdownItem
              icon={Pencil}
              label={editLabel}
              tone="primary"
              close={close}
              onClick={onEdit}
            />
          ) : null}
          {confirmDelete ? (
            <div
              className="quote-menu-delete-confirm flex w-full items-center justify-center px-1 py-1"
              onClick={(event) => event.stopPropagation()}
              role="menuitem"
              aria-label="Silmeyi onayla"
            >
              <QuoteOrderInlineConfirm
                label="Sil"
                labelClass="quote-order-undo-sil"
                ariaLabel={deleteAriaLabel}
                onConfirm={() => {
                  onDelete?.()
                  setConfirmDelete(false)
                  close()
                }}
                onCancel={() => setConfirmDelete(false)}
              />
            </div>
          ) : (
            <DropdownItem
              icon={Trash2}
              label="Sil"
              tone="danger"
              close={close}
              closeOnClick={false}
              onClick={() => setConfirmDelete(true)}
            />
          )}
        </>
      )}
    </Dropdown>
  )
}
