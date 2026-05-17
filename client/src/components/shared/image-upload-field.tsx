'use client'

import { useRef, useState } from 'react'
import { ImagePlus, X, Upload, Camera, Loader2 } from 'lucide-react'

interface Props {
  value?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  accept?: string
  isUploading?: boolean
  hint?: string
  shape?: 'square' | 'circle'
  size?: 'sm' | 'md' | 'lg'
  emptyLabel?: string
  fallback?: React.ReactNode
}

const sizeMap = {
  sm: 'h-20 w-20',
  md: 'h-40 w-40',
  lg: 'h-56 w-56',
}

export function ImageUploadField({
  value,
  onChange,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  isUploading,
  hint = 'JPEG, PNG, WebP (max 5MB)',
  shape = 'square',
  size = 'md',
  emptyLabel = 'Click để chọn ảnh',
  fallback,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const rounded = shape === 'circle' ? 'rounded-full' : 'rounded-lg'
  const sizeClass = sizeMap[size]

  const triggerPicker = () => inputRef.current?.click()

  return (
    <>
      {value || fallback ? (
        <div className="flex items-start gap-4">
          {/* Click anh -> mo preview */}
          <button
            type="button"
            onClick={() => value && setPreviewOpen(true)}
            disabled={!value}
            className={`relative overflow-hidden border bg-muted ${rounded} ${sizeClass} group shrink-0`}
            title={value ? 'Xem ảnh' : ''}
          >
            {value ? (
              <img src={value} alt="Anh hien tai" className="h-full w-full object-cover" />
            ) : (
              fallback
            )}
            {value && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                <span className="text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Xem ảnh
                </span>
              </span>
            )}
            {isUploading && (
              <span className={`absolute inset-0 flex items-center justify-center bg-black/50 ${rounded}`}>
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </span>
            )}
          </button>

          {/* Nut doi anh */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={triggerPicker}
              disabled={isUploading}
              className="flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              {shape === 'circle' ? <Camera className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
              {value ? 'Đổi ảnh' : 'Chọn ảnh'}
            </button>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        </div>
      ) : (
        /* Empty state: click vung lon de upload */
        <button
          type="button"
          onClick={triggerPicker}
          disabled={isUploading}
          className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:bg-accent/50 disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          ) : (
            <ImagePlus className="h-10 w-10 text-muted-foreground" />
          )}
          <span className="mt-2 text-sm text-muted-foreground">{emptyLabel}</span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
      />

      {/* Preview modal */}
      {previewOpen && value && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Đóng"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={value}
            alt="Xem ảnh"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
