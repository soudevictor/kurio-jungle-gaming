import { zodResolver } from "@hookform/resolvers/zod"
import { createFileRoute } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { EyeOff } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/features/auth/auth-context"
import { useChangePassword, useUpdateProfile } from "@/features/profile/use-profile"
import { ApiError } from "@/lib/api/client"

export const Route = createFileRoute("/_authenticated/profile/")({
  component: ProfilePage,
})

const profileSchema = z.object({
  name: z.string().min(2, "Informe seu nome de exibição."),
  username: z.string().min(2, "Informe seu nome de usuário."),
  email: z.string().email("E-mail inválido."),
  ensName: z.string().min(1, "Informe seu Nome ENS."),
  walletAlias: z.string().min(1, "Informe o apelido da carteira."),
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

export function ProfilePage() {
  const { user } = useAuth()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { 
      name: user?.name ?? "", 
      username: "", 
      email: user?.email ?? "",
      ensName: "",
      walletAlias: ""
    },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  async function onSubmitProfile(values: z.infer<typeof profileSchema>) {
    try {
      await updateProfile.mutateAsync({ name: values.name }) // Simplified for existing mutation
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
    <div className="w-full max-w-4xl">
      <h1 className="mb-8 font-heading text-xl md:text-2xl font-bold text-text-primary">Perfil do colecionador</h1>

      {/* Main Profile Form */}
      <Form {...profileForm}>
        <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-8" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={profileForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">
                    Nome de exibição <span className="text-primary">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input className="bg-black/40 border-border-soft h-10 md:h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={profileForm.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">
                    Nome de usuário <span className="text-primary">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input className="bg-black/40 border-border-soft h-10 md:h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={profileForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">
                    E-mail <span className="text-primary">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input className="bg-black/40 border-border-soft h-10 md:h-12" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={profileForm.control}
              name="ensName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">
                    Nome ENS <span className="text-primary">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="flex">
                      <select className="h-10 md:h-12 w-[80px] rounded-l-lg border border-r-0 border-border-soft bg-black/40 px-3 text-sm text-text-primary outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary">
                        <option value=".eth">.eth</option>
                      </select>
                      <Input className="flex-1 rounded-l-none bg-black/40 border-border-soft h-10 md:h-12 focus-visible:z-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={profileForm.control}
              name="walletAlias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">
                    Apelido da carteira <span className="text-primary">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input className="bg-black/40 border-border-soft h-10 md:h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>

      {/* Avatar Section */}
      <div className="mt-8">
        <h2 className="mb-4 font-heading text-sm font-semibold text-text-secondary">
          Avatar
        </h2>
        <div className="flex flex-row items-center gap-4">
          <Avatar className="size-16 border border-border-soft">
            <AvatarImage src={user?.avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="bg-surface-card text-lg">{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <Button type="button" className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 font-medium">
            Alterar
          </Button>
          <Button type="button" variant="ghost" className="text-text-secondary hover:text-text-primary hover:bg-transparent h-10 px-4 font-medium">
            Remover
          </Button>
        </div>
      </div>

      {/* Password Section */}
      <div className="mt-10 max-w-sm">
        <h2 className="mb-4 font-heading text-sm font-semibold text-text-secondary">
          Alterar senha
        </h2>
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="flex flex-col space-y-4" noValidate>
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">Senha atual</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="password" autoComplete="current-password" className="bg-black/40 border-border-soft h-10 md:h-12 pr-10" {...field} />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-text-primary">
                        <EyeOff className="size-4" />
                      </button>
                    </div>
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
                  <FormLabel className="text-text-secondary">Nova senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="password" autoComplete="new-password" className="bg-black/40 border-border-soft h-10 md:h-12 pr-10" {...field} />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-text-primary">
                        <EyeOff className="size-4" />
                      </button>
                    </div>
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
                  <FormLabel className="text-text-secondary">Confirmar nova senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="password" autoComplete="new-password" className="bg-black/40 border-border-soft h-10 md:h-12 pr-10" {...field} />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-text-primary">
                        <EyeOff className="size-4" />
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-4 mb-34 md:mb-0">
              <Button type="button" onClick={profileForm.handleSubmit(onSubmitProfile)} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 md:h-12 px-8 font-medium w-fit min-w-[120px]">
                {updateProfile.isPending || changePassword.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

