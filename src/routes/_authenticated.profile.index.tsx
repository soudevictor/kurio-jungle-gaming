import { zodResolver } from "@hookform/resolvers/zod"
import { createFileRoute } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/features/auth/auth-context"
import { useChangePassword, useUpdateProfile } from "@/features/profile/use-profile"
import { ApiError } from "@/lib/api/client"

export const Route = createFileRoute("/_authenticated/profile/")({
  component: ProfilePage,
})

const profileSchema = z.object({
  name: z.string().min(2, "Informe seu nome completo."),
  bio: z.string().max(280, "Máximo de 280 caracteres.").optional(),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual."),
    newPassword: z.string().min(6, "A nova senha deve ter ao menos 6 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  })

function ProfilePage() {
  const { user } = useAuth()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", bio: user?.bio ?? "" },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  async function onSubmitProfile(values: z.infer<typeof profileSchema>) {
    try {
      await updateProfile.mutateAsync(values)
      toast.success("Perfil atualizado")
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        for (const [field, message] of Object.entries(err.fields)) {
          profileForm.setError(field as keyof z.infer<typeof profileSchema>, { message })
        }
      } else {
        toast.error(err instanceof ApiError ? err.message : "Não foi possível atualizar o perfil.")
      }
    }
  }

  async function onSubmitPassword(values: z.infer<typeof passwordSchema>) {
    try {
      await changePassword.mutateAsync(values)
      toast.success("Senha alterada")
      passwordForm.reset()
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        for (const [field, message] of Object.entries(err.fields)) {
          passwordForm.setError(field as keyof z.infer<typeof passwordSchema>, { message })
        }
      } else {
        toast.error(err instanceof ApiError ? err.message : "Não foi possível alterar a senha.")
      }
    }
  }

  return (
    <div className="container-kurio max-w-2xl space-y-8 py-10">
      <h1 className="font-heading text-2xl font-bold">Perfil do colecionador</h1>

      <section className="rounded-xl border border-border/60 bg-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <Avatar className="size-14">
            <AvatarImage src={user?.avatarUrl ?? undefined} alt="" />
            <AvatarFallback>{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4" noValidate>
            <FormField
              control={profileForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={profileForm.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Salvando…" : "Salvar alterações"}
            </Button>
          </form>
        </Form>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Alterar senha
        </h2>
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4" noValidate>
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha atual</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nova senha</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" variant="outline" disabled={changePassword.isPending}>
              {changePassword.isPending ? "Alterando…" : "Alterar senha"}
            </Button>
          </form>
        </Form>
      </section>
    </div>
  )
}
