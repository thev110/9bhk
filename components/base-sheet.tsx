"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Icon } from "./icon";

export function BaseSheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="base-sheet-backdrop" />
        <Dialog.Popup className="base-sheet-popup">
          <div className="sheet-grab" aria-hidden />
          <div className="between base-sheet-header">
            {title ? <Dialog.Title className="base-sheet-title">{title}</Dialog.Title> : <div />}
            <Dialog.Close className="icon-btn base-sheet-close" aria-label="Close dialog">
              <Icon name="close" />
            </Dialog.Close>
          </div>
          <div className="base-sheet-content">
            {children}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
