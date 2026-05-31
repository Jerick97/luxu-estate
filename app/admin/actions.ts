'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(userId: string, newRole: 'admin' | 'user') {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (_) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  // Wait, if RLS protects user_profiles, simple updating using the ANON_KEY will fail if the user is not auth.uid() == ID unless they are admin.
  // We already added RLS. Let's make the update query. Supabase SSR client acts as the currently logged in user.
  // RLS says: Admins can update all profiles.
  
  // Verify current logged-in user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  // Execute update
  const { error } = await supabase
    .from('user_profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) {
    console.error('Error updating role:', error)
    throw new Error('Failed to update user role')
  }

  // Revalidate to reflect changes immediately
  revalidatePath('/admin')
  return { success: true }
}
