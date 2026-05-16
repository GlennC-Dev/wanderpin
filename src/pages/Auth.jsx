import { supabase } from '../lib/supabase'

export default function Auth() {
  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) console.error(error)
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>🗺️ WanderPin</h1>
      <p style={{ color: '#666' }}>Your interactive travel companion</p>
      <button
        onClick={handleGoogleLogin}
        style={{
          background: '#4285F4',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          fontSize: '16px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Sign in with Google
      </button>
    </div>
  )
}