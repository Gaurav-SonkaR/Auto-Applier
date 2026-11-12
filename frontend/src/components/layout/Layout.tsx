import type { ReactNode } from 'react'
import { Header } from './Header'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">{children}</main>
      <footer className="border-t border-gray-200 py-3 text-center text-xs text-gray-400">
        AutoApply AI — local only, runs on 127.0.0.1
      </footer>
    </div>
  )
}
