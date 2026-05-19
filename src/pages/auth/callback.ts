import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  const incomingCookies = parseCookieHeader(request.headers.get('Cookie') ?? '');
  const verifier = incomingCookies.find(c => c.name.includes('code-verifier'));
  console.log(`[callback] code=${!!code} cookieCount=${incomingCookies.length} verifier=${verifier ? 'FOUND' : 'MISSING'}`);

  if (!code) {
    return redirect('/login?error=missing_code');
  }

  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          console.log('[callback] setAll called with:', cookiesToSet.map(c => c.name).join(','));
          cookiesToSet.forEach(({ name, value, options }) => {
            // Remove httpOnly so the browser Supabase client (createBrowserClient)
            // can read the session cookies via document.cookie and stay authenticated.
            const { httpOnly: _httpOnly, ...browserReadableOptions } = options ?? {};
            cookies.set(name, value, { ...browserReadableOptions, httpOnly: false });
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(`[callback] exchange ERROR: ${error.message} status=${(error as any).status}`);
    return redirect('/login?error=1');
  }

  console.log(`[callback] exchange SUCCESS user=${data.session?.user?.email}`);
  return redirect('/');
};
