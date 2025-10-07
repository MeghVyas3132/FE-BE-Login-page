import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const SUPA_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPA_ANON = process.env.REACT_APP_SUPABASE_ANON_KEY;
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:4000';

const supabase = createClient(SUPA_URL, SUPA_ANON);

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load existing session on mount
  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (session && mounted) {
        setUser(session.user);
      }
    }
    load();
    return () => { mounted = false };
  }, []);

  async function signIn() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return alert(error.message);
    setUser(data.user);
  }

  async function signUp() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: email.split('@')[0] } } });
    setLoading(false);
    if (error) return alert(error.message);
    alert('Check your email for confirmation if required');
  }

  async function fetchProfile() {
    if (!user) return alert('Sign in first');
    const session = await supabase.auth.getSession();
    const access_token = session?.data?.session?.access_token;
    if (!access_token) return alert('No access token');

    const res = await fetch(`${SERVER_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || 'Error fetching profile');
    setProfile(json.profile);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  return (
    <div className="app-wrap">
      <div className="container">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div className="brand">MyApp <span style={{fontWeight:400, color:'#8b95a6', marginLeft:8}}>Supabase demo</span></div>
          {user ? <div style={{color:'#9aa4b2'}}>Signed in as {user.email}</div> : null}
        </div>

        <div className="grid">
          <div className="card">
            {!user ? (
              <>
                <label>Email</label>
                <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <label>Password</label>
                <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                <div className="buttons" style={{marginTop:12}}>
                  <button onClick={signIn} disabled={loading}>Sign in</button>
                  <button className="secondary" onClick={signUp} disabled={loading}>Sign up</button>
                </div>
              </>
            ) : (
              <div>
                <div className="profile">
                  <div className="avatar">{user.email?.charAt(0).toUpperCase()}</div>
                  <div>
                    <div style={{fontWeight:600}}>{user.email}</div>
                    <div style={{color:'#8b95a6',fontSize:13}}>Member since: {new Date(user.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <div style={{marginTop:12}}>
                  <button onClick={fetchProfile}>Fetch profile</button>
                  <button className="secondary" onClick={logout} style={{marginLeft:8}}>Logout</button>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3>Profile</h3>
            {profile ? (
              <pre>{JSON.stringify(profile, null, 2)}</pre>
            ) : (
              <div style={{color:'#9aa4b2'}}>No profile loaded. When signed in, click "Fetch profile" to load it from the server.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
