'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const accessToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('accessToken='))
        ?.split('=')[1]

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken ? decodeURIComponent(accessToken) : ''}`,
        },
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Upload failed')
      }

      const data = await res.json()
      return data.data.url as string
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Upload ảnh thất bại')
    },
  })
}
