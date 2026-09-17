import { zodResolver } from "@hookform/resolvers/zod"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Eye, EyeOff } from "lucide-react"
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
  const [showPassword, setShowPassword] = useState(false)

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
                  className="h-12 sm:h-14 bg-transparent border-border-soft px-4"
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
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Senha"
                    className="h-12 sm:h-14 bg-transparent border-border-soft px-4 pr-12"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary focus:outline-none"
                    aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showPassword ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={outOfScopeToast}
            className="text-sm text-primary hover:underline ml-auto"
          >
            Esqueceu a senha?
          </button>
        </div>

        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-error">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button type="submit" className="h-12 sm:h-14 w-full text-base font-semibold normal-case font-sans tracking-normal" disabled={isLoggingIn}>
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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4" noValidate>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input autoComplete="name" placeholder="Nome de usuário" className="h-12 sm:h-14 bg-transparent border-border-soft px-4" {...field} />
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
                  className="h-12 sm:h-14 bg-transparent border-border-soft px-4"
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
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Senha"
                    className="h-12 sm:h-14 bg-transparent border-border-soft px-4 pr-12"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary focus:outline-none"
                    aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showPassword ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
                  </button>
                </div>
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
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirmar senha"
                    className="h-12 sm:h-14 bg-transparent border-border-soft px-4 pr-12"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary focus:outline-none"
                    aria-label={showConfirmPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showConfirmPassword ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
                  </button>
                </div>
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

        <Button type="submit" className="mt-1 sm:mt-2 h-12 sm:h-14 w-full text-base font-semibold normal-case font-sans tracking-normal" disabled={isRegistering}>
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
      <div className="relative my-4 sm:my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border-soft/60" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#140b07] sm:bg-[#1A110D] px-2 text-text-secondary">Ou continue com</span>
        </div>
      </div>
      <div className="space-y-2 sm:space-y-3">
        <Button
          variant="outline"
          className="h-12 sm:h-14 w-full bg-transparent text-sm font-medium"
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
          className="h-12 sm:h-14 w-full bg-transparent text-sm font-medium"
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

  function handleClose() {
    onClose()
  }

  function handleSuccess() {
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="flex flex-col justify-center !w-full !max-w-full !h-[100dvh] !rounded-none !border-0 bg-[#140b07] p-6 sm:justify-start sm:!h-auto sm:!max-w-[500px] sm:!border-x-0 sm:!border-t-0 sm:!border-b-8 sm:!border-primary sm:bg-surface-card sm:p-8 overflow-y-auto sm:shadow-2xl"
        aria-describedby={undefined}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex justify-center pt-0 pb-4 sm:hidden">
          <span className="font-heading text-2xl font-bold tracking-[0.2em] text-text-primary">KURIO</span>
        </div>

        <DialogTitle className="text-center font-heading text-xl sm:text-[22px] font-bold sm:sr-only mb-4 sm:mb-6">
          {activeTab === "login" ? "Entrar" : "Criar perfil de colecionador"}
        </DialogTitle>

        {/* Tab switcher - Desktop only */}
        <div className="mb-6 hidden sm:flex items-center justify-center gap-3 font-heading text-[22px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={activeTab === "login" ? "text-primary" : "text-text-secondary hover:text-text-primary transition-colors"}
          >
            Entrar
          </button>
          <span className="h-5 w-[1px] bg-border-soft/60" />
          <button
            type="button"
            onClick={() => setActiveTab("signup")}
            className={activeTab === "signup" ? "text-primary" : "text-text-secondary hover:text-text-primary transition-colors"}
          >
            Criar conta
          </button>
        </div>

        {/* Subtitle - Desktop only */}
        <p className="mb-6 mt-1 hidden sm:block text-center text-sm leading-relaxed text-text-secondary">
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

        {/* Mobile Toggle */}
        <div className="mt-6 sm:mt-8 text-center sm:hidden">
          {activeTab === "login" ? (
            <button type="button" onClick={() => setActiveTab("signup")} className="text-sm text-text-secondary hover:text-text-primary">
              Novo na Kurio? <span className="text-primary">Crie uma conta</span>
            </button>
          ) : (
            <button type="button" onClick={() => setActiveTab("login")} className="text-sm text-text-secondary hover:text-text-primary">
              Já tem uma conta? <span className="text-primary">Entre</span>
            </button>
          )}
        </div>

        {/* Test credentials hint */}
        <div className="mt-4 text-center text-xs text-text-secondary/50">
          Credenciais de teste: <strong>collector@kurio.app</strong> / <strong>artlover@kurio.app</strong>
          <br />
          Senha: <strong>kurio123</strong>
        </div>
      </DialogContent>
    </Dialog>
  )
}
