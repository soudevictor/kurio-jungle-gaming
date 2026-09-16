import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/features/auth/auth-context"
import { ApiError } from "@/lib/api/client"

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail.").email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
})

const signupSchema = z
  .object({
    name: z.string().min(2, "Informe seu nome completo."),
    email: z.string().min(1, "Informe seu e-mail.").email("Informe um e-mail válido."),
    password: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  })

function outOfScopeToast() {
  toast("Fora do escopo desta entrega", {
    description: "Autenticação social não faz parte do desafio.",
  })
}

// ---------------------------------------------------------------------------
// Login Form
// ---------------------------------------------------------------------------

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login, isLoggingIn } = useAuth()

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      await login(values)
      onSuccess()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fields) {
          for (const [field, message] of Object.entries(err.fields)) {
            form.setError(field as keyof z.infer<typeof loginSchema>, { message })
          }
        } else {
          form.setError("root", { message: err.message })
        }
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="Digite seu e-mail"
                  className="h-12 bg-transparent"
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
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Senha"
                  className="h-12 bg-transparent"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-start">
          <button
            type="button"
            onClick={outOfScopeToast}
            className="text-xs text-text-secondary hover:text-text-primary hover:underline"
          >
            Esqueceu a senha?
          </button>
        </div>

        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-error">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={isLoggingIn}>
          {isLoggingIn ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </Form>
  )
}

// ---------------------------------------------------------------------------
// Signup Form
// ---------------------------------------------------------------------------

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, isRegistering } = useAuth()

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  })

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    try {
      await register(values)
      onSuccess()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fields) {
          for (const [field, message] of Object.entries(err.fields)) {
            if (field in form.getValues()) form.setError(field as keyof z.infer<typeof signupSchema>, { message })
          }
        } else {
          form.setError("root", { message: err.message })
        }
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input autoComplete="name" placeholder="Nome de usuário" className="h-12 bg-transparent" {...field} />
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
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="Digite seu e-mail"
                  className="h-12 bg-transparent"
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
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Senha"
                  className="h-12 bg-transparent"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirmar senha"
                  className="h-12 bg-transparent"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-error">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button type="submit" className="mt-2 h-12 w-full text-base font-semibold" disabled={isRegistering}>
          {isRegistering ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>
    </Form>
  )
}

// ---------------------------------------------------------------------------
// Social Auth Divider
// ---------------------------------------------------------------------------

function SocialAuth() {
  return (
    <>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border-soft/60" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#1A110D] px-2 text-text-secondary">Ou continue com</span>
        </div>
      </div>
      <div className="space-y-3">
        <Button
          variant="outline"
          className="h-12 w-full bg-transparent text-sm font-medium"
          onClick={() =>
            toast("Fora do escopo desta entrega", {
              description: "Autenticação social não faz parte do desafio.",
            })
          }
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="mr-2 size-5" alt="" />
          Continuar com Google
        </Button>
        <Button
          variant="outline"
          className="h-12 w-full bg-transparent text-sm font-medium"
          onClick={() =>
            toast("Fora do escopo desta entrega", {
              description: "Autenticação social não faz parte do desafio.",
            })
          }
        >
          <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="mr-2 size-5" alt="" />
          Continuar com Facebook
        </Button>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Auth Modal
// ---------------------------------------------------------------------------

type AuthTab = "login" | "signup"

interface AuthModalProps {
  open: boolean
  defaultTab?: AuthTab
  onClose: () => void
}

export function AuthModal({ open, defaultTab = "login", onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>(defaultTab)
  const navigate = useNavigate()
  const router = useRouter()

  function handleClose() {
    onClose()
    // Navigate back or to home
    if (router.history.length > 1) {
      router.history.back()
    } else {
      navigate({ to: "/" })
    }
  }

  function handleSuccess() {
    onClose()
    navigate({ to: "/" })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="max-h-[90vh] w-full max-w-[440px] overflow-y-auto rounded-2xl border border-border-soft/60 bg-[#1A110D] p-8 shadow-2xl"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">
          {activeTab === "login" ? "Entrar na Kurio" : "Criar conta na Kurio"}
        </DialogTitle>

        {/* Tab switcher */}
        <div className="mb-6 flex gap-6 border-b border-border-soft/40 pb-4 font-heading text-xl font-semibold text-text-secondary">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={
              activeTab === "login"
                ? "relative text-primary after:absolute after:bottom-[-17px] after:left-0 after:h-0.5 after:w-full after:bg-primary"
                : "transition-colors hover:text-text-primary"
            }
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("signup")}
            className={
              activeTab === "signup"
                ? "relative text-primary after:absolute after:bottom-[-17px] after:left-0 after:h-0.5 after:w-full after:bg-primary"
                : "transition-colors hover:text-text-primary"
            }
          >
            Criar conta
          </button>
        </div>

        {/* Subtitle */}
        <p className="mb-6 mt-1 text-sm leading-relaxed text-text-secondary">
          {activeTab === "login"
            ? "Acesse seu perfil de colecionador, acompanhe suas coleções favoritas e conecte sua carteira."
            : "Crie seu perfil de colecionador e conecte uma carteira quando quiser."}
        </p>

        {/* Form */}
        {activeTab === "login" ? (
          <LoginForm onSuccess={handleSuccess} />
        ) : (
          <SignupForm onSuccess={handleSuccess} />
        )}

        <SocialAuth />

        {/* Test credentials hint */}
        <div className="mt-4 rounded-lg border border-border-soft/40 bg-surface-card/30 p-3 text-xs text-text-secondary">
          Credenciais de teste: <strong>collector@kurio.app</strong> / <strong>artlover@kurio.app</strong>
          <br />
          Senha: <strong>kurio123</strong>
        </div>
      </DialogContent>
    </Dialog>
  )
}
