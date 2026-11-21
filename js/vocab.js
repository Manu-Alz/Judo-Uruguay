/* Vocabulario del dojo: números, saludos y frases, árbitro.
   Cada ítem: [romaji, japonés, significado]. */

/* Del 1 al 10: [número, kanji, lectura, kana (para el audio)] */
const NUMEROS = [
  [1, "一", "ichi", "いち"],
  [2, "二", "ni", "に"],
  [3, "三", "san", "さん"],
  [4, "四", "shi / yon", "し"],
  [5, "五", "go", "ご"],
  [6, "六", "roku", "ろく"],
  [7, "七", "shichi / nana", "しち"],
  [8, "八", "hachi", "はち"],
  [9, "九", "kyū / ku", "きゅう"],
  [10, "十", "jū", "じゅう"],
];

const FRASES = [
  {
    id: "dojo", title: "Saludos y vida del dojo",
    items: [
      ["Rei", "礼", "Saludo. Empieza y termina todo."],
      ["Onegaishimasu", "お願いします", "“Por favor”: se dice al empezar a practicar con alguien."],
      ["Arigatō gozaimashita", "ありがとうございました", "“Muchas gracias”: se dice al terminar la práctica."],
      ["Kiotsuke", "気をつけ", "¡Atención!"],
      ["Seiretsu", "整列", "¡Formen fila!"],
      ["Kiritsu", "起立", "¡De pie!"],
      ["Seiza", "正座", "Sentarse de rodillas."],
      ["Mokusō", "黙想", "Meditar, cerrar los ojos un momento."],
      ["Hai", "はい", "Sí. También: entendido."],
      ["Sumimasen", "すみません", "Disculpá / permiso."],
      ["Sensei", "先生", "Maestro, profesor."],
      ["Senpai", "先輩", "Compañero con más experiencia."],
      ["Kōhai", "後輩", "Compañero con menos experiencia."],
      ["Dojo", "道場", "El lugar donde se estudia el camino."],
      ["Tatami", "畳", "La superficie de práctica."],
      ["Judogi", "柔道着", "El uniforme."],
      ["Obi", "帯", "El cinturón."],
    ],
  },
  {
    id: "arbitro", title: "El árbitro y el combate",
    items: [
      ["Hajime", "始め", "¡Comiencen!"],
      ["Matte", "待て", "¡Esperen! Se frena el combate."],
      ["Sore-made", "それまで", "Fin del combate."],
      ["Yoshi", "よし", "Sigan / continúen."],
      ["Sono-mama", "そのまま", "No se muevan."],
      ["Ippon", "一本", "Punto completo: gana el combate."],
      ["Waza-ari", "技あり", "Casi punto. Dos suman ippon."],
      ["Osaekomi", "抑込", "Inmovilización en curso."],
      ["Toketa", "解けた", "Se rompió la inmovilización."],
      ["Shido", "指導", "Penalización leve."],
      ["Hansoku-make", "反則負け", "Descalificación."],
      ["Hantei", "判定", "Decisión de los árbitros."],
      ["Maitta", "まいった", "“Me rindo”: el golpecito de rendición."],
    ],
  },
];
