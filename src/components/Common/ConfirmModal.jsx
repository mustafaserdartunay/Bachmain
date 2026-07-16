import { Modal, Button } from '@bachmain/ui'

/** Shared confirm dialog — replaces window.confirm over time */
export function ConfirmModal({
  open,
  title = 'Onay',
  description,
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgeç',
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={(
        <>
          <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      )}
    >
      {description ? <p className="ds-body text-ds-muted">{description}</p> : null}
    </Modal>
  )
}

export default ConfirmModal
