import { Suspense } from 'react'
import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-6 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  )
}