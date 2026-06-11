import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { QueryKey } from "@tanstack/react-query"
import { toast } from "sonner"

type ApiSuccess = { success: true; error?: undefined; [key: string]: unknown }
type ApiError = { success: false; error: string; [key: string]: unknown }
type ApiResult = ApiSuccess | ApiError

interface UseActionOptions<TResult, TVariables = void> {
  successMessage?: string | ((result: TResult, variables: TVariables) => string)
  invalidateKeys?: QueryKey[]
  onSuccess?: (result: TResult, variables: TVariables) => void
  onError?: (error: string) => void
  onSettled?: () => void
}

function hasSuccessField(result: unknown): result is ApiResult {
  return (
    typeof result === "object" &&
    result !== null &&
    "success" in result
  )
}

function isSuccessResult(result: ApiResult): result is ApiSuccess {
  return result.success === true
}

export function useAction<TResult, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  options: UseActionOptions<TResult, TVariables>,
) {
  const queryClient = useQueryClient()
  const { successMessage, invalidateKeys, onSuccess, onError, onSettled } = options

  return useMutation({
    mutationFn,
    onSuccess: (result: TResult, variables: TVariables) => {
      if (hasSuccessField(result)) {
        if (isSuccessResult(result)) {
          if (invalidateKeys) {
            for (const key of invalidateKeys) {
              queryClient.invalidateQueries({ queryKey: key })
            }
          }
          const msg = typeof successMessage === "function"
            ? (successMessage as (r: unknown, v: unknown) => string)(result, variables)
            : successMessage
          if (msg) toast.success(msg)
          onSuccess?.(result, variables)
        } else {
          const fallback = typeof successMessage === "string" ? successMessage : undefined
          const message = result.error || fallback || "Something went wrong"
          toast.error(message)
          onError?.(message)
        }
      } else {
        const msg = typeof successMessage === "function"
          ? (successMessage as (r: unknown, v: unknown) => string)(result, variables)
          : successMessage
        if (msg) toast.success(msg)
        onSuccess?.(result, variables)
      }
    },
    onError: (error: Error) => {
      const message = error.message || "Something went wrong"
      toast.error(message)
      onError?.(message)
    },
    onSettled: () => {
      onSettled?.()
    },
  })
}
