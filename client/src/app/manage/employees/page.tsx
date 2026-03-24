'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import http from '@/lib/http'
import type { Account, ApiResponse, PaginatedResponse } from '@/types'
import { toast } from 'sonner'

export default function ManageEmployeesPage() {
  const t = useTranslations()
  const queryClient = useQueryClient()

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('manage.employees')}</h1>
        <Link
          href="/manage/employees/add"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {t('common.add')} nhân viên
        </Link>
      </div>

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
                  <td className="px-4 py-3 text-sm">{emp.role}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/manage/employees/${emp.id}/edit`}
                        className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
                      >
                        {t('common.edit')}
                      </Link>
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
                    </div>
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
