export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--surface-sunken)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-elevated)',
        padding: '48px 40px',
        width: '100%',
        maxWidth: 400,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        textAlign: 'center',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--color-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 18,
            flexShrink: 0,
          }}>J</div>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Jobit
          </span>
        </div>

        <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 36, lineHeight: 1.5 }}>
          Tu búsqueda laboral, ordenada.<br />
          Gestiona ofertas, contactos y CVs en un solo lugar.
        </p>

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '11px 20px',
            background: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text)',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.15s, border-color 0.15s',
            fontFamily: 'var(--font-sans)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-muted)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          Iniciar sesión con Microsoft
        </button>

        <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-subtle)', textAlign: 'center' }}>
          Al continuar, aceptas los términos de uso de Jobit.
        </p>
      </div>
    </div>
  );
}
