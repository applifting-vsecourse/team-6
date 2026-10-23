import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type LeaveKvintetDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onConfirm: () => void
  isLeaving: boolean
  isActiveKvintet: boolean
}

export function LeaveKvintetDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isLeaving,
  isActiveKvintet,
}: LeaveKvintetDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("kvintet.dialog.leaveTitle")}</DialogTitle>
          <DialogDescription>
            {isActiveKvintet
              ? t("kvintet.dialog.leaveActiveConfirm")
              : t("kvintet.dialog.leaveProposalConfirm")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLeaving}
          >
            {t("kvintet.dialog.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLeaving}
          >
            {t("kvintet.dialog.confirmLeave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
