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
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatNumber } from "@/lib/date"
import { getErrorMessage } from "@/lib/errorMessage"
import { useMediaQuery } from "@/lib/useMediaQuery"
import { cn } from "@/lib/utils"

import { referenceQueryOptions } from "@/features/kvintet/api/referenceQueryOptions"
import { useStartKvintet } from "@/features/kvintet/hooks/useStartKvintet"
import { useSlugLabel } from "@/features/kvintet/lib/useSlugLabel"

// Same limits as the backend DTO; the server stays the authority.
const TITLE_MAX = 120
const DESCRIPTION_MIN = 10
const DESCRIPTION_MAX = 280
const CATEGORIES_MAX = 3

const createSchema = (t: TFunction) =>
  z.object({
    title: z
      .string()
      .trim()
      .min(1, t("kvintet.validation.titleRequired"))
      .max(TITLE_MAX, t("kvintet.validation.titleTooLong", { max: TITLE_MAX })),
    categorySlugs: z
      .array(z.string())
      .min(1, t("kvintet.validation.categoryRequired"))
      .max(CATEGORIES_MAX),
    description: z
      .string()
      .trim()
      .min(1, t("kvintet.validation.descriptionRequired"))
      .min(DESCRIPTION_MIN, t("kvintet.validation.descriptionTooShort", { min: DESCRIPTION_MIN }))
      .max(DESCRIPTION_MAX, t("kvintet.validation.descriptionTooLong", { max: DESCRIPTION_MAX })),
  })

type FormValues = z.infer<ReturnType<typeof createSchema>>

const defaultValues: FormValues = { title: "", categorySlugs: [], description: "" }

type StartKvintetDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  /** Seed of the signed-in person's blobatar; without it the dialog shows no avatar. */
  avatarSeed?: string
}

export function StartKvintetDialog({ isOpen, onOpenChange, avatarSeed }: StartKvintetDialogProps) {
  const { t } = useTranslation()
  const label = useSlugLabel()
  // Same breakpoint as the bottom-sheet layout below (Tailwind `sm` = 40rem).
  const isPhone = useMediaQuery("(max-width: 39.99rem)")
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
      categorySlugs: values.categorySlugs,
      description: values.description,
    })

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      {/* Below `sm` the dialog sits at the bottom like the mobile design's sheet. */}
      <DialogContent
        isBottomSheet
        showCloseButton={false}
        // On phones keep focus on the dialog itself: focusing the first input would pop the keyboard up on open.
        onOpenAutoFocus={(event) => {
          if (!isPhone) return
          event.preventDefault()
          if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus()
        }}
        className="gap-4.5 p-7 max-sm:gap-4 max-sm:p-4 max-sm:pt-3 sm:max-w-130 sm:rounded-lg"
      >
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
              name="categorySlugs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("kvintet.dialog.category")}</FormLabel>
                  <FormControl>
                    <ToggleGroup
                      type="multiple"
                      variant="outline"
                      spacing={2}
                      role="group"
                      aria-label={t("kvintet.dialog.category")}
                      value={field.value}
                      onValueChange={field.onChange}
                      className="w-auto flex-wrap justify-start"
                    >
                      {reference?.categories.map(({ slug }) => (
                        <ToggleGroupItem
                          key={slug}
                          value={slug}
                          // A fourth cannot be picked; the chosen ones stay pressable to undo.
                          disabled={
                            !field.value.includes(slug) && field.value.length >= CATEGORIES_MAX
                          }
                          className="h-8 rounded-full border-input px-3 font-semibold text-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
                        >
                          {label("categories", slug)}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => {
                const isAtLimit = field.value.length >= DESCRIPTION_MAX
                return (
                  <FormItem>
                    <FormLabel>{t("kvintet.dialog.details")}</FormLabel>
                    <FormControl>
                      <Textarea
                        className={cn(
                          "resize-none bg-card",
                          isAtLimit &&
                            "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                        )}
                        placeholder={t("kvintet.dialog.detailsPlaceholder")}
                        maxLength={DESCRIPTION_MAX}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription
                      className={cn(
                        "justify-self-end font-mono text-meta",
                        isAtLimit && "text-destructive",
                      )}
                    >
                      {t("kvintet.dialog.detailsCount", {
                        length: formatNumber(field.value.length),
                        max: formatNumber(DESCRIPTION_MAX),
                      })}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )
              }}
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
