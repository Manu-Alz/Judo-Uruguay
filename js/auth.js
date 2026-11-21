/* Cuentas, perfiles, avisos y asistencia del dojo (Supabase). Si no hay configuración, Auth.enabled es false.
   Las reglas de seguridad viven en la base (supabase/schema.sql): acá solo se llama a la API. */
const Auth = (() => {
  const cfg = window.SUPABASE || {};
  const enabled = !!(cfg.url && cfg.key && window.supabase);
  let client = null, user = null, onRecovery = null;
  const subs = [];
  if (enabled) client = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: true, autoRefreshToken: true } });
  const emit = () => subs.forEach((f) => f(user));

  const MSG = [
    [/invalid login/i, "Email o contraseña incorrectos."],
    [/already registered|already been registered/i, "Ese email ya tiene una cuenta. Probá ingresar."],
    [/at least 6|weak password|password should/i, "La contraseña tiene que tener al menos 6 caracteres."],
    [/not confirmed/i, "Falta confirmar tu email. Revisá tu correo."],
    [/valid email|invalid email|email address.*invalid/i, "Ese email no parece válido."],
    [/rate limit|too many|for security purposes/i, "Demasiados intentos. Esperá un momento y probá de nuevo."],
    [/same password|different from the old/i, "La contraseña nueva tiene que ser distinta a la anterior."],
    [/row-level security|permission denied|violates row/i, "No tenés permiso para hacer eso."],
    [/duplicate key|unique/i, "Eso ya estaba registrado."],
    [/network|failed to fetch/i, "No hay conexión. Probá de nuevo."],
  ];
  const nice = (e) => { const m = (e && e.message) || String(e); const hit = MSG.find(([re]) => re.test(m)); return new Error(hit ? hit[1] : "No se pudo completar. Probá de nuevo."); };
  const ok = ({ data, error }) => { if (error) throw nice(error); return data; };

  return {
    enabled,
    get user() { return user; },
    onChange(f) { subs.push(f); },
    onRecovery(f) { onRecovery = f; },
    async init() {
      if (!enabled) return;
      client.auth.onAuthStateChange((event, s) => {
        user = s?.user || null;
        /* fuera del callback: supabase-js puede colgarse si se llama a su API desde adentro */
        if (event === "PASSWORD_RECOVERY" && onRecovery) setTimeout(onRecovery, 0);
        setTimeout(emit, 0);
      });
      try { const { data } = await client.auth.getSession(); user = data.session?.user || null; } catch {}
      emit();
    },

    /* cuenta */
    async signUp(email, password, name) {
      /* el link del mail vuelve a esta misma página (debe estar en "Redirect URLs" de Supabase) */
      const back = location.origin + location.pathname;
      const { data, error } = await client.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: back } });
      if (error) throw nice(error);
      return { needsConfirm: !data.session };
    },
    async signIn(email, password) { ok(await client.auth.signInWithPassword({ email, password })); },
    async signOut() { await client.auth.signOut(); },
    async resetPassword(email) { ok(await client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname })); },
    async updatePassword(password) { ok(await client.auth.updateUser({ password })); },

    /* perfiles */
    async getProfile() { return ok(await client.from("profiles").select("*").eq("id", user.id).maybeSingle()); },
    async saveProfile(p) { ok(await client.from("profiles").upsert({ id: user.id, ...p, updated_at: new Date().toISOString() })); },
    async listProfiles() { return ok(await client.from("profiles").select("id,name,belt,belt_by_sensei,done,learning,is_sensei").order("name")) || []; },
    async setBelt(id, belt) { ok(await client.from("profiles").update({ belt }).eq("id", id)); },   /* solo el sensei: lo exige la base */

    /* avisos (publica y borra solo el sensei: lo exige la base) */
    async listAnnouncements() { return ok(await client.from("announcements").select("id,body,created_at").order("created_at", { ascending: false }).limit(5)) || []; },
    async addAnnouncement(body) { ok(await client.from("announcements").insert({ body })); },
    async deleteAnnouncement(id) { ok(await client.from("announcements").delete().eq("id", id)); },

    /* asistencia (el día lo fija la base, hora de Montevideo) */
    async listAttendance(sinceDay) { return ok(await client.from("attendance").select("user_id,day").gte("day", sinceDay)) || []; },
    async checkIn() { ok(await client.from("attendance").insert({ user_id: user.id })); },
    async undoCheckIn(day) { ok(await client.from("attendance").delete().eq("user_id", user.id).eq("day", day)); },
  };
})();
