import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "@tanstack/react-router"
import type { TFunction } from "i18next"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { z } from "zod"

import { ROUTES } from "@/app/routes"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const PASSWORD_MIN_LENGTH = 8

const createSchema = (t: TFunction) =>
  z
    .object({
      email: z
        .string()
        .trim()
        .min(1, t("auth.validation.emailRequired"))
        .email(t("auth.validation.emailInvalid")),
      name: z.string().trim().min(1, t("auth.validation.nameRequired")),
      username: z.string().trim().min(1, t("auth.validation.usernameRequired")),
      password: z
        .string()
        .trim()
        .min(PASSWORD_MIN_LENGTH, t("auth.validation.passwordMin", { count: PASSWORD_MIN_LENGTH })),
      passwordConfirmation: z
        .string()
        .trim()
        .min(1, t("auth.validation.passwordConfirmationRequired")),
      acceptCodeOfConduct: z.boolean().refine((isAccepted) => isAccepted, {
        message: t("auth.validation.codeOfConductRequired"),
      }),
    })
    .refine((values) => values.password === values.passwordConfirmation, {
      message: t("auth.validation.passwordsMatch"),
      path: ["passwordConfirmation"],
    })

type FormValues = z.infer<ReturnType<typeof createSchema>>

const defaultValues: FormValues = {
  email: "",
  name: "",
  username: "",
  password: "",
  passwordConfirmation: "",
  acceptCodeOfConduct: false,
}

type SignUpFormProps = {
  isLoading: boolean
  errorMessage?: string | null
  onSubmit: (values: FormValues) => void | Promise<void>
}

export function SignUpForm({ isLoading, errorMessage, onSubmit }: SignUpFormProps) {
  const { t } = useTranslation()
  const schema = useMemo(() => createSchema(t), [t])
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.name")}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.username")}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="username"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.email")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.password")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="passwordConfirmation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.confirmPassword")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="acceptCodeOfConduct"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    className="mt-0.5"
                  />
                </FormControl>
                {/* block: the base label is flex, which would split the sentence around the link */}
                <FormLabel className="block leading-snug font-normal">
                  <Trans
                    i18nKey="auth.acceptCodeOfConduct"
                    components={{
                      coc: (
                        <Link
                          to={ROUTES.codeOfConduct}
                          target="_blank"
                          className="font-medium text-foreground underline underline-offset-4"
                        />
                      ),
                    }}
                  />
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("auth.signUp")}
        </Button>
      </form>
    </Form>
  )
}
