import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const { userId } = auth()

  if (userId) {
    redirect('/dashboard/overview')
  }

  redirect('/auth/login')
}
