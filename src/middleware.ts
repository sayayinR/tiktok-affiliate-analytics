import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/auth/login(.*)',
  '/auth/register(.*)',
  '/api/health(.*)',
  '/api/auth/tiktok/callback(.*)',
  '/api/auth/tiktok/debug(.*)',
  '/onboarding(.*)',
  '/legal(.*)',
  '/tiktok(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      const { redirectToSignIn } = await auth()
      return redirectToSignIn()
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}