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
      {/* Video background - place a file at public/bg-tech.mp4 */}
      <video className="bg-video" autoPlay muted loop playsInline>
        <source src="/bg-tech.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="bg-overlay" aria-hidden />
      <div className="bg-animated" aria-hidden />
      <div className="container">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div className="brand">MyApp <span style={{fontWeight:400, color:'#8b95a6', marginLeft:8}}>Supabase demo</span></div>
          {user ? <div style={{color:'#9aa4b2'}}>Signed in as {user.email}</div> : null}
        </div>

        <div className="grid" style={{gridTemplateColumns: user ? '1fr' : '1fr', gap:22}}>
          {/* When not signed in: show only the auth/sign-up card */}
          {!user && (
            <div className="card">
              <label>Email</label>
              <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
              <label>Password</label>
              <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <div className="buttons" style={{marginTop:12}}>
                <button onClick={signIn} disabled={loading}>Sign in</button>
                <button className="secondary button-glass" onClick={signUp} disabled={loading}>Sign up</button>
              </div>
              <div style={{marginTop:10}}>
                {!forgotMode ? (
                  <button className="secondary button-glass" onClick={() => setForgotMode(true)}>Forgot password?</button>
                ) : (
                  <>
                    <button className="secondary button-glass" onClick={sendPasswordReset}>Send reset link</button>
                    <button className="secondary button-glass" onClick={() => setForgotMode(false)} style={{marginLeft:8}}>Cancel</button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* When signed in: show only the profile/admin card */}
          {user && (
            <div className="card">
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

              <h3 style={{marginTop:18}}>Profile</h3>
              {profile ? (
                <div style={{marginTop:8}}>
                  <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
                    <div className="avatar" style={{width:72,height:72,fontSize:20}}>{(profile.email||user.email||'').charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{fontWeight:700,fontSize:16}}>{profile.full_name || user.email}</div>
                      <div style={{color:'#8b95a6',fontSize:13}}>{profile.email || user.email}</div>
                    </div>
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div style={{background:'rgba(255,255,255,0.02)',padding:12,borderRadius:8}}>
                      <div style={{color:'#9aa4b2',fontSize:12}}>Role</div>
                      <div style={{fontWeight:600,marginTop:6}}>{profile.role || 'user'}</div>
                    </div>
                    <div style={{background:'rgba(255,255,255,0.02)',padding:12,borderRadius:8}}>
                      <div style={{color:'#9aa4b2',fontSize:12}}>User ID</div>
                      <div style={{fontWeight:600,marginTop:6,wordBreak:'break-all'}}>{profile.id}</div>
                    </div>
                  </div>

                  {/* render extra metadata (created_at, updated_at etc.) */}
                  <div style={{marginTop:12}}>
                    <div style={{color:'#9aa4b2',fontSize:12,marginBottom:8}}>Details</div>
                    <div style={{display:'grid',gap:8}}>
                      {Object.entries(profile).filter(([k])=>!['id','email','full_name','role'].includes(k)).map(([k,v]) => (
                        <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'rgba(255,255,255,0.01)',borderRadius:8}}>
                          <div style={{color:'#9aa4b2',fontSize:13}}>{k}</div>
                          <div style={{fontWeight:600,color:'#e6eef8'}}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{color:'#9aa4b2'}}>No profile loaded. Click "Fetch profile" to load it from the server.</div>
              )}

              {/* Admin area (visible when signed in) */}
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
          )}
        </div>
      </div>
    </div>
  );
}
