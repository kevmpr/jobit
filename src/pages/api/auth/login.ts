import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const origin = new URL(request.url).origin;

  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          console.log('[login] setting cookies:', cookiesToSet.map(c => c.name).join(', '));
          cookiesToSet.forEach(({ name, value, options }) =>
            cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: `${origin}/auth/callback`,
      scopes: 'email profile openid',
    },
  });

  if (error || !data.url) {
    return redirect('/login?error=1');
  }

  return redirect(data.url);
};
