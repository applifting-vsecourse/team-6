import { useTranslation } from "react-i18next"

import { GazeBlobatar } from "@/components/GazeBlobatar"
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
  avatarSeed?: string
}

export function DeleteAccountDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isDeleting,
  avatarSeed,
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
      <DialogContent className="gap-4 bg-card p-6 max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:p-4 max-sm:pt-3 max-sm:pb-7 max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=closed]:zoom-out-100 max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=open]:zoom-in-100 sm:max-w-[480px] sm:rounded-[14px] sm:p-7">
        <span
          aria-hidden
          className="mx-auto h-1 w-10 rounded-full bg-input sm:hidden"
        />
        {avatarSeed ? (
          <GazeBlobatar
            name={avatarSeed}
            animate="always"
            className="mx-auto size-14 sm:mx-0 sm:size-16"
          />
        ) : null}
        <DialogHeader className="gap-2 text-center sm:text-left">
          <DialogTitle className="text-h2 font-semibold text-foreground">
            {t("account.deleteDialog.title")}
          </DialogTitle>
          <DialogDescription className="text-compact text-muted-foreground sm:text-body">
            {t("account.deleteDialog.description")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {t("account.deleteDialog.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? t("account.deleteDialog.deleting") : t("account.deleteDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
