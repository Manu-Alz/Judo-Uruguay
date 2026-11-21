/* Conexión de cuentas (Supabase). Si url y key quedan vacíos, la app funciona
   sin inicio de sesión (solo con el progreso guardado en cada teléfono).
   La key es la Publishable key del proyecto: está pensada para ir en el navegador.
   La seguridad la dan las políticas (RLS) de supabase/schema.sql.
   NUNCA poner acá la Secret key. */
window.SUPABASE = {
  url: "https://yfztisycjnhptwgwwlfj.supabase.co",
  key: "sb_publishable_nBA_aRKHurvdPeAYmsq3Bg_ChCGiGQi",
};
