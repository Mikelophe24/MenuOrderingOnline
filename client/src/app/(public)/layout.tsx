import { Header } from '@/components/layout/header'
import type { ReactNode } from 'react'

export default function PublicLayout({
  children,
  modal,
}: {
  children: ReactNode
  modal: ReactNode
}) {
  return (
    <>
      <Header />
      <main className="container py-6">{children}</main>
      {modal}
    </>
  )
}
