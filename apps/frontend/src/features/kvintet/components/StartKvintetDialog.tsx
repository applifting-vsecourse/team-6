import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import type { TFunction } from "i18next"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { GazeBlobatar } from "@/components/GazeBlobatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getErrorMessage } from "@/lib/errorMessage"

import { referenceQueryOptions } from "@/features/kvintet/api/referenceQueryOptions"
import { useStartKvintet } from "@/features/kvintet/hooks/useStartKvintet"
import { useSlugLabel } from "@/features/kvintet/lib/useSlugLabel"

// Same limits as the backend DTO; the server stays the authority.
const TITLE_MAX = 120
const DESCRIPTION_MAX = 500

const createSchema = (t: TFunction) =>
  z.object({
    title: z
      .string()
      .trim()
      .min(1, t("kvintet.validation.titleRequired"))
      .max(TITLE_MAX, t("kvintet.validation.titleTooLong", { max: TITLE_MAX })),
    categorySlug: z.string().min(1, t("kvintet.validation.categoryRequired")),
    description: z
      .string()
      .trim()
      .max(DESCRIPTION_MAX, t("kvintet.validation.descriptionTooLong", { max: DESCRIPTION_MAX })),
  })

type FormValues = z.infer<ReturnType<typeof createSchema>>

const defaultValues: FormValues = { title: "", categorySlug: "", description: "" }

type StartKvintetDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  /** Seed of the signed-in person's blobatar; without it the dialog shows no avatar. */
  avatarSeed?: string
}

export function StartKvintetDialog({ isOpen, onOpenChange, avatarSeed }: StartKvintetDialogProps) {
  const { t } = useTranslation()
  const label = useSlugLabel()
  const schema = useMemo(() => createSchema(t), [t])
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues })
  const { data: reference } = useQuery(referenceQueryOptions())
  const start = useStartKvintet()

  const handleOpenChange = (isNextOpen: boolean) => {
    if (!isNextOpen) {
      form.reset()
      start.reset()
    }
    onOpenChange(isNextOpen)
  }

  const handleSubmit = (values: FormValues) =>
    start.mutate({
      title: values.title,
      categorySlugs: [values.categorySlug],
      description: values.description || undefined,
    })

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      {/* Below `sm` the dialog sits at the bottom like the mobile design's sheet. */}
      <DialogContent
        showCloseButton={false}
        className="gap-4.5 bg-card p-7 max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:gap-4 max-sm:rounded-b-none max-sm:p-4 max-sm:pt-3 max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=closed]:zoom-out-100 max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=open]:zoom-in-100 sm:max-w-130"
      >
        <span
          aria-hidden
          className="mx-auto h-1 w-10 rounded-full bg-border sm:hidden"
        />
        <div className="flex items-center gap-3.5">
          {avatarSeed ? (
            // You are in colour; the grey faces are everyone you have not met yet.
            <GazeBlobatar
              name={avatarSeed}
              animate="always"
              className="size-11 shrink-0 max-sm:hidden"
            />
          ) : null}
          <DialogHeader className="gap-0.5 text-left">
            <DialogTitle className="text-subheading leading-tight font-semibold">
              {t("kvintet.dialog.title")}
            </DialogTitle>
            <DialogDescription className="text-small text-muted-foreground">
              {t("kvintet.dialog.description")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-4.5"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("kvintet.dialog.topic")}</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-card"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("kvintet.dialog.topicHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categorySlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("kvintet.dialog.category")}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger
                        className="bg-card"
                        onBlur={field.onBlur}
                      >
                        <SelectValue placeholder={t("kvintet.dialog.categoryPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reference?.categories.map((category) => (
                        <SelectItem
                          key={category.slug}
                          value={category.slug}
                        >
                          {label("categories", category.slug)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("kvintet.dialog.details")}</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none bg-card"
                      placeholder={t("kvintet.dialog.detailsPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-small text-muted-foreground">{t("kvintet.dialog.note")}</p>

            {start.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{getErrorMessage(start.error)}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                {t("kvintet.dialog.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={start.isPending}
              >
                {start.isPending ? <Loader2 className="animate-spin" /> : null}
                {t("kvintet.dialog.submit")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
