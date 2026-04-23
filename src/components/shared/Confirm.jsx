import { Modal } from './Modal.jsx';

export function Confirm({ open, onCancel, onConfirm, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', tone = 'danger' }) {
  const btnClass = {
    danger: 'btn-danger',
    success: 'btn-success',
    brand: 'btn-primary',
    dark: 'btn-dark'
  }[tone];

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      tone={tone === 'success' ? 'success' : tone === 'danger' ? 'danger' : 'neutral'}
      footer={
        <>
          <button className="btn-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className={btnClass} onClick={onConfirm}>{confirmLabel}</button>
        </>
      }
    >
      <div className="p-5">
        <h3 className="font-bold text-base text-fg">{title}</h3>
        {description && <p className="text-xs text-fg-muted mt-1.5 leading-relaxed">{description}</p>}
      </div>
    </Modal>
  );
}
