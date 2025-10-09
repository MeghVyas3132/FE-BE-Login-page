require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // service role key for server-side

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Protected route: client sends Authorization: Bearer <access_token>
app.get('/api/profile', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];

  try {
    // Verify JWT using Supabase auth admin endpoint
    const { data: user, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user?.user) {
      return res.status(401).json({ error: 'Invalid token', details: userErr?.message });
    }

    const userId = user.user.id;

    const { data: profile, error: profileErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileErr) return res.status(500).json({ error: profileErr.message });

    return res.json({ profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get profile by id (admin can fetch any profile)
app.get('/api/profile/:id', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];
  const requestedId = req.params.id;

  try {
    const { data: user, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user?.user) return res.status(401).json({ error: 'Invalid token' });

    const requesterId = user.user.id;

    // If requester is not the owner, check admin
    if (requesterId !== requestedId) {
      const { data: requesterProfile, error: rpErr } = await supabase
        .from('users')
        .select('role')
        .eq('id', requesterId)
        .single();
      if (rpErr) return res.status(500).json({ error: rpErr.message });
      if (requesterProfile?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    }

    const { data: profile, error: profileErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', requestedId)
      .single();

    if (profileErr) return res.status(500).json({ error: profileErr.message });
    return res.json({ profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// List all profiles (admin only)
app.get('/api/profiles', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];

  try {
    const { data: user, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user?.user) return res.status(401).json({ error: 'Invalid token' });

    const requesterId = user.user.id;
    const { data: requesterProfile, error: rpErr } = await supabase
      .from('users')
      .select('role')
      .eq('id', requesterId)
      .single();
    if (rpErr) return res.status(500).json({ error: rpErr.message });
    if (requesterProfile?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const { data: profiles, error: profilesErr } = await supabase
      .from('users')
      .select('*');
    if (profilesErr) return res.status(500).json({ error: profilesErr.message });
    return res.json({ profiles });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Change role for a user (admin only). Body: { id: '<uuid>', role: 'admin'|'user' }
app.post('/api/role', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];
  const { id: targetId, role: newRole } = req.body || {};
  if (!targetId || !newRole) return res.status(400).json({ error: 'Missing id or role' });

  try {
    const { data: user, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user?.user) return res.status(401).json({ error: 'Invalid token' });

    const requesterId = user.user.id;
    const { data: requesterProfile, error: rpErr } = await supabase
      .from('users')
      .select('role')
      .eq('id', requesterId)
      .single();
    if (rpErr) return res.status(500).json({ error: rpErr.message });
    if (requesterProfile?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    // Use the SQL function to set role (requires service_role on server)
    const { data: rpcData, error: rpcErr } = await supabase.rpc('set_user_role', { target_uuid: targetId, new_role: newRole });
    if (rpcErr) {
      // fallback to direct update if rpc failed
  const { data: upd, error: updErr } = await supabase.from('users').update({ role: newRole }).eq('id', targetId);
      if (updErr) return res.status(500).json({ error: updErr.message });
      return res.json({ ok: true });
    }

    return res.json({ ok: true, rpc: rpcData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on ${port}`));
