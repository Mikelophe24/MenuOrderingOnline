'use client'

import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { useMutation } from '@tanstack/react-query'
import http from '@/lib/http'
import { useForm } from 'react-hook-form'
import { useUploadImage } from '@/hooks/use-upload'
import { toast } from 'sonner'
import { ImageUploadField } from '@/components/shared/image-upload-field'

interface ProfileForm {
  name: string
  avatar?: string
}

export default function AccountPage() {
  const account = useAuthStore((s) => s.account)
  const setAccount = useAuthStore((s) => s.setAccount)
  const uploadImage = useUploadImage()

  const { register, handleSubmit, setValue, watch } = useForm<ProfileForm>({
    defaultValues: { name: account?.name ?? '', avatar: account?.avatar ?? '' },
  })

  const avatarUrl = watch('avatar')

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) => http.put('/auth/me', data),
    onSuccess: (_, variables) => {
      if (account) {
        setAccount({ ...account, ...variables })
      }
      toast.success('Cập nhật thông tin thành công')
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadImage.mutate(file, {
      onSuccess: (url) => {
        setValue('avatar', url)
      },
    })
  }

  const initials = account?.name?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Tài khoản</h1>

      <form onSubmit={handleSubmit((d) => updateProfile.mutate(d))} className="space-y-4">
        {/* Avatar */}
        <div>
          <label className="text-sm font-medium">Ảnh đại diện</label>
          <div className="mt-2">
            <ImageUploadField
              value={avatarUrl || undefined}
              onChange={handleAvatarChange}
              isUploading={uploadImage.isPending}
              shape="circle"
              size="sm"
              hint="JPEG, PNG, WebP"
              emptyLabel="Click để thêm ảnh đại diện"
              fallback={
                <div className="flex h-full w-full items-center justify-center bg-primary text-2xl font-bold text-primary-foreground">
                  {initials}
                </div>
              }
            />
          </div>
          <input type="hidden" {...register('avatar')} />
        </div>

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

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            Cập nhật
          </button>
          <Link
            href="/manage/accounts/change-password"
            className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
          >
            Đổi mật khẩu
          </Link>
        </div>
      </form>
    </div>
  )
}
