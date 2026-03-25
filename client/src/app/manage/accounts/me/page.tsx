'use client'

import { useRef } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useMutation } from '@tanstack/react-query'
import http from '@/lib/http'
import { useForm } from 'react-hook-form'
import { useUploadImage } from '@/hooks/use-upload'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'

interface ProfileForm {
  name: string
  avatar?: string
}

export default function AccountPage() {
  const account = useAuthStore((s) => s.account)
  const setAccount = useAuthStore((s) => s.setAccount)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
        <div className="flex items-center gap-4">
          <div
            className="relative cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
            {uploadImage.isPending && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Click để đổi ảnh đại diện
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
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
