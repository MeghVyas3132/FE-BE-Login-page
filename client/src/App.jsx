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
  const [allProfiles, setAllProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

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

  async function sendPasswordReset() {
    if (!email) return alert('Enter email to reset');
    setLoading(true);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
    setLoading(false);
    if (error) return alert(error.message);
    alert('If the email exists, a password reset link has been sent.');
    setForgotMode(false);
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

  async function fetchAllProfiles() {
    const session = await supabase.auth.getSession();
    const access_token = session?.data?.session?.access_token;
    if (!access_token) return alert('Sign in first');
    const res = await fetch(`${SERVER_URL}/api/profiles`, { headers: { Authorization: `Bearer ${access_token}` } });
    const json = await res.json();
    if (!res.ok) return alert(json.error || 'Error fetching profiles');
    setAllProfiles(json.profiles || []);
  }

  async function setUserRole(targetId, newRole) {
    const session = await supabase.auth.getSession();
    const access_token = session?.data?.session?.access_token;
    if (!access_token) return alert('Sign in first');
    const res = await fetch(`${SERVER_URL}/api/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
      body: JSON.stringify({ id: targetId, role: newRole }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || 'Error setting role');
    alert('Role updated');
    fetchAllProfiles();
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
                <div style={{marginTop:10}}>
                  {!forgotMode ? (
                    <button className="secondary" onClick={() => setForgotMode(true)}>Forgot password?</button>
                  ) : (
                    <>
                      <button className="secondary" onClick={sendPasswordReset}>Send reset link</button>
                      <button className="secondary" onClick={() => setForgotMode(false)} style={{marginLeft:8}}>Cancel</button>
                    </>
                  )}
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

            {/* Admin area */}
            <div style={{marginTop:16}}>
              <h4>Admin</h4>
              <div style={{display:'flex',gap:8}}>
                <button className="secondary" onClick={fetchAllProfiles}>Load all users</button>
              </div>
              {allProfiles.length > 0 && (
                <div style={{marginTop:12}}>
                  {allProfiles.map(p => (
                    <div key={p.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.02)'}}>
                      <div>
                        <div style={{fontWeight:600}}>{p.email}</div>
                        <div style={{color:'#8b95a6'}}>{p.full_name || '—'} • {p.role || 'user'}</div>
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        {p.role !== 'admin' ? (
                          <button onClick={() => setUserRole(p.id, 'admin')}>Promote</button>
                        ) : (
                          <button className="secondary" onClick={() => setUserRole(p.id, 'user')}>Demote</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
