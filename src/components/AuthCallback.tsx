import { createBrowserClient } from '@supabase/ssr';
import { useEffect } from 'react';

const supabase = createBrowserClient(
  import.meta.env.PUBLIC_SUPABASE_URL!,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallback() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error('Auth error:', error.message);
          window.location.href = '/login';
        } else {
          window.location.href = '/';
        }
      });
    } else {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f1e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Geist, system-ui, sans-serif',
      fontSize: 16,
    }}>
      Iniciando sesión...
    </div>
  );
}
