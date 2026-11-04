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

type DeleteAccountDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteAccountDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteAccountDialogProps) {
  const { t } = useTranslation()

  const handleOpenChange = (isNextOpen: boolean) => {
    if (!isDeleting) {
      onOpenChange(isNextOpen)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("account.deleteDialog.title")}</DialogTitle>
          <DialogDescription>{t("account.deleteDialog.description")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            {t("account.deleteDialog.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? t("account.deleteDialog.deleting") : t("account.deleteDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
