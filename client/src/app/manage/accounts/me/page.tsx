'use client'

import { useAuthStore } from '@/stores/auth.store'
import { useMutation } from '@tanstack/react-query'
import http from '@/lib/http'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

interface ProfileForm {
  name: string
  avatar?: string
}

export default function AccountPage() {
  const account = useAuthStore((s) => s.account)
  const setAccount = useAuthStore((s) => s.setAccount)

  const { register, handleSubmit } = useForm<ProfileForm>({
    defaultValues: { name: account?.name ?? '' },
  })

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) => http.put('/auth/me', data),
    onSuccess: (_, variables) => {
      if (account) {
        setAccount({ ...account, ...variables })
      }
      toast.success('Cập nhật thông tin thành công')
    },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Tài khoản</h1>

      <form onSubmit={handleSubmit((d) => updateProfile.mutate(d))} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            value={account?.email ?? ''}
            disabled
            className="mt-1 w-full rounded-md border bg-muted px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Tên</label>
          <input
            {...register('name')}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Role</label>
          <input
            value={account?.role ?? ''}
            disabled
            className="mt-1 w-full rounded-md border bg-muted px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          Cập nhật
        </button>
      </form>
    </div>
  )
}
