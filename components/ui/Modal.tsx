"use client";

import React from "react";
import { TAILWIND, LOADING_SPINNER } from "@/lib/theme";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  height?: string;
}

export function Modal({
  open,
  onClose,
  title,
  loading = false,
  error,
  children,
  height = "520px",
}: ModalProps) {
  if (!open) return null;

  return (
    <div className={TAILWIND.modal.overlay}>
      {/* Overlay */}
      <div className={TAILWIND.modal.background} onClick={onClose} />

      {/* Modal Container */}
      <div className={TAILWIND.modal.container}>
        {/* Header */}
        {title && (
          <div className={TAILWIND.modal.header}>
            <div className="min-w-0">
              <div className={TAILWIND.modal.title}>{title}</div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className={TAILWIND.modal.body}>
          {loading ? (
            <div style={{ height }} className="w-full flex items-center justify-center">
              <div className="flex items-center gap-3 text-gray-300">
                <div className={`${LOADING_SPINNER.size} rounded-full ${LOADING_SPINNER.borderColor} ${LOADING_SPINNER.animation}`} />
                <span className="text-sm">Loading…</span>
              </div>
            </div>
          ) : error ? (
            <div style={{ height }} className="w-full flex items-center justify-center">
              <div className="text-red-400 text-sm max-w-md">{error}</div>
            </div>
          ) : (
            <div style={{ height }}>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
