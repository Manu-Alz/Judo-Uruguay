/* Cuentas y perfiles compartidos del dojo (Supabase). Si no hay configuración, Auth.enabled es false. */
const Auth = (() => {
  const cfg = window.SUPABASE || {};
  const enabled = !!(cfg.url && cfg.key && window.supabase);
  let client = null, user = null;
  const subs = [];
  if (enabled) client = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: true, autoRefreshToken: true } });
  const emit = () => subs.forEach((f) => f(user));

  const MSG = [
    [/invalid login/i, "Email o contraseña incorrectos."],
    [/already registered|already been registered/i, "Ese email ya tiene una cuenta. Probá ingresar."],
    [/at least 6/i, "La contraseña tiene que tener al menos 6 caracteres."],
    [/not confirmed/i, "Falta confirmar tu email. Revisá tu correo."],
    [/valid email|invalid email|email address.*invalid/i, "Ese email no parece válido."],
    [/rate limit|too many/i, "Demasiados intentos. Esperá un momento y probá de nuevo."],
    [/network|failed to fetch/i, "No hay conexión. Probá de nuevo."],
  ];
  const nice = (e) => { const m = (e && e.message) || String(e); const hit = MSG.find(([re]) => re.test(m)); return new Error(hit ? hit[1] : "No se pudo completar. Probá de nuevo."); };

  return {
    enabled,
    get user() { return user; },
    onChange(f) { subs.push(f); },
    async init() {
      if (!enabled) return;
      try { const { data } = await client.auth.getSession(); user = data.session?.user || null; } catch {}
      client.auth.onAuthStateChange((_e, s) => { user = s?.user || null; emit(); });
      emit();
    },
    async signUp(email, password, name) {
      const { data, error } = await client.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw nice(error);
      return { needsConfirm: !data.session };
    },
    async signIn(email, password) { const { error } = await client.auth.signInWithPassword({ email, password }); if (error) throw nice(error); },
    async signOut() { await client.auth.signOut(); },
    async getProfile() { const { data, error } = await client.from("profiles").select("*").eq("id", user.id).maybeSingle(); if (error) throw nice(error); return data; },
    async saveProfile(p) { const { error } = await client.from("profiles").upsert({ id: user.id, ...p, updated_at: new Date().toISOString() }); if (error) throw nice(error); },
    async listProfiles() { const { data, error } = await client.from("profiles").select("id,name,belt,done,learning,is_sensei").order("name"); if (error) throw nice(error); return data || []; },
  };
})();
