/**
 * Modal — overlay dialog
 * Contract: COMPONENT_CONTRACTS.md §Modal
 * Export: named only (never default)
 *
 * Usage:
 *   import { Modal } from '../components/Modal'
 *   <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Add Activity">
 *     {children}
 *   </Modal>
 *
 * Notes:
 *   - Renders via React createPortal → document.body (avoids z-index stacking issues)
 *   - Controlled by `open` (mount/unmount, not visibility)
 *   - Escape key + backdrop click both call onClose
 *   - Entry animation: fade + slide-up (200ms)
 */

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children }) {
  const panelRef = useRef(null);

  // ── Escape key closes modal ──────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // ── Lock body scroll while open ──────────────────────────────
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // ── Focus trap: move focus into modal on open ────────────────
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  // Contract: open controls mount/unmount — not hidden visibility
  if (!open) return null;

  return createPortal(
    <div
      // Backdrop
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(31, 42, 36, 0.5)' }}
      onClick={(e) => {
        // Close if clicking directly on backdrop (not on panel)
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Modal panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="
          relative w-full max-w-[560px]
          bg-[var(--color-surface)]
          rounded-[var(--radius-md)]
          outline-none
          flex flex-col
          max-h-[90vh]
          overflow-hidden
        "
        style={{ boxShadow: 'var(--shadow-modal)' }}
        // Animate in via CSS animation defined below
        data-modal-panel
      >
        {/* Header */}
        <div
          className="
            flex items-center justify-between
            px-6 py-5
            border-b border-[var(--color-border)]
            shrink-0
          "
        >
          <h2
            className="text-h2 text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="
              p-1.5 rounded-[var(--radius-sm)]
              text-[var(--color-muted)]
              hover:text-[var(--color-ink)]
              hover:bg-[var(--color-border)] hover:bg-opacity-50
              transition-colors duration-150
              cursor-pointer
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>

      {/* Entry animation keyframes — injected once */}
      <style>{`
        [data-modal-panel] {
          animation: gt-modal-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes gt-modal-in {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>,
    document.body,
  );
}
