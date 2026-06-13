import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import {
  CRM_DELETE_BUTTON_CLASS,
  CRM_EDIT_BUTTON_CLASS,
} from '../../utils/bachBrand'
import {
  DELETE_TRASH_BUTTON_CLASS,
  DELETE_TRASH_BUTTON_HIDDEN_CLASS,
  EDIT_PENCIL_BUTTON_CLASS,
  ListInlineDeleteConfirmPopover,
} from '../Common/ListDeleteConfirmPanel'

export function CrmEditAction({ onEdit, className = '', title = 'Düzenle', brand = false }) {
  const buttonClass = brand ? CRM_EDIT_BUTTON_CLASS : EDIT_PENCIL_BUTTON_CLASS

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onEdit?.()
      }}
      className={`${buttonClass} shrink-0 rounded-lg ${className}`}
      title={title}
    >
      <Pencil className="h-3.5 w-3.5" />
    </button>
  )
}

export function CrmDeleteAction({ onDelete, className = '', brand = false }) {
  const [pendingDelete, setPendingDelete] = useState(false)
  const buttonClass = brand ? CRM_DELETE_BUTTON_CLASS : DELETE_TRASH_BUTTON_CLASS

  return (
    <div className={`relative shrink-0 ${className}`} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={() => setPendingDelete(true)}
        className={`${buttonClass} rounded-lg ${pendingDelete ? DELETE_TRASH_BUTTON_HIDDEN_CLASS : ''}`}
        title="Sil"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      {pendingDelete && (
        <ListInlineDeleteConfirmPopover
          onConfirm={() => {
            onDelete?.()
            setPendingDelete(false)
          }}
          onCancel={() => setPendingDelete(false)}
        />
      )}
    </div>
  )
}
