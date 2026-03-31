'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import http from '@/lib/http'
import type { Account, ApiResponse, PaginatedResponse } from '@/types'
import { Role } from '@/types'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'

function CreateAccountForm({ onClose, onSuccess, t }: { onClose: () => void; onSuccess: () => void; t: (key: string) => string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<string>('Employee')

  const createMutation = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role: string }) =>
      http.post<ApiResponse<Account>>('/accounts', data),
    onSuccess: () => {
      toast.success('Tạo tài khoản thành công')
      onSuccess()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Tạo tài khoản thất bại')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Email không hợp lệ')
      return
    }
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    createMutation.mutate({ name: name.trim(), email: email.trim(), password, role })
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Tạo tài khoản mới</h3>
        <button onClick={onClose} className="rounded-md p-1 hover:bg-accent">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Tên</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Nguyễn Văn A"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Ít nhất 6 ký tự"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Vai trò</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {Object.values(Role).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function ManageEmployeesPage() {
  const t = useTranslations()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => http.get<ApiResponse<PaginatedResponse<Account>>>('/accounts'),
  })

  const deleteEmployee = useMutation({
    mutationFn: (id: number) => http.delete<ApiResponse<null>>(`/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Xóa nhân viên thành công')
    },
  })

  const updateRole = useMutation({
    mutationFn: ({ id, name, role }: { id: number; name: string; role: string }) =>
      http.put<ApiResponse<null>>(`/accounts/${id}`, { name, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Cập nhật role thành công')
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('manage.employees')}</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Tạo tài khoản
        </button>
      </div>

      {showCreateForm && (
        <CreateAccountForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['employees'] })}
          t={t}
        />
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground">Đang tải...</div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Tên</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.data?.map((emp: Account) => (
                <tr key={emp.id} className="border-b">
                  <td className="px-4 py-3 text-sm">{emp.name}</td>
                  <td className="px-4 py-3 text-sm">{emp.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      value={emp.role}
                      onChange={(e) =>
                        updateRole.mutate({ id: emp.id, name: emp.name, role: e.target.value })
                      }
                      className={`rounded-full px-2 py-1 text-xs border-none cursor-pointer ${
                        emp.role === 'Owner'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      }`}
                    >
                      {Object.values(Role).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (confirm(`Xóa nhân viên "${emp.name}"?`)) {
                          deleteEmployee.mutate(emp.id)
                        }
                      }}
                      className="rounded-md border border-destructive px-3 py-1 text-sm text-destructive"
                    >
                      {t('common.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
