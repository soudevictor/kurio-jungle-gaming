import { useMutation, useQueryClient } from "@tanstack/react-query"
import { profileApi } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/query/keys"

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileApi.update,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.session(), (old: { user: typeof user; token: string; expiresAt: string } | undefined) =>
        old ? { ...old, user } : old,
      )
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: profileApi.changePassword,
  })
}
