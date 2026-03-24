'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePasswordSchema, type ChangePasswordFormValues } from '@/schemas/auth.schema'
import { useMutation } from '@tanstack/react-query'
import http from '@/lib/http'
import { toast } from 'sonner'

export default function ChangePasswordPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  })

  const changePassword = useMutation({
    mutationFn: (data: ChangePasswordFormValues) => http.put('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công')
      reset()
    },
    onError: () => {
      toast.error('Mật khẩu cũ không đúng')
    },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Đổi mật khẩu</h1>

      <form onSubmit={handleSubmit((d) => changePassword.mutate(d))} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Mật khẩu cũ</label>
          <input
            type="password"
            {...register('oldPassword')}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
          {errors.oldPassword && (
            <p className="mt-1 text-sm text-destructive">{errors.oldPassword.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Mật khẩu mới</label>
          <input
            type="password"
            {...register('newPassword')}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
          {errors.newPassword && (
            <p className="mt-1 text-sm text-destructive">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            {...register('confirmNewPassword')}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
          {errors.confirmNewPassword && (
            <p className="mt-1 text-sm text-destructive">{errors.confirmNewPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={changePassword.isPending}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          Đổi mật khẩu
        </button>
      </form>
    </div>
  )
}
