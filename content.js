/* ==========================================================================
   CONTENIDO DEL CALENDARIO — este es el único archivo que necesitas editar
   para personalizar los textos, fechas y sorpresas.

   • En cualquier texto puedes usar {forName} y {fromName}.
   • Los párrafos se separan con una línea en blanco (\n\n).
   • Las fotos/vídeos son rutas relativas a esta carpeta (p. ej. "fotos/dia2.jpg").

   TIPOS DE SORPRESA (campo "type"):
     message  → carta / mensaje          { title, text, image? }
     photo    → foto con texto           { title, image, text? }
     coupon   → cupón canjeable          { title, offer, conditions? }
     song     → canción (Spotify/YouTube){ title, url, text? }
     video    → vídeo (archivo o enlace) { title, video | url, text? }
     riddle   → acertijo que se resuelve { title, question, answers[], hint?, reward }

   Opcionales en cualquier día: icon (emoji de la casilla abierta).
   ========================================================================== */

window.CONFIG = {
  year: 2026,          // año del calendario
  month: 12,           // mes (12 = diciembre)
  title: "Calendario de Adviento",
  eyebrow: null,       // null = "Diciembre 2026" automático; o escribe tu propio texto
  subtitle: "Una sorpresa cada día, solo para el amor de mi vida",
  forName: "Mi amada",  // cómo la llamas
  fromName: "Pat",
  footer: "Hecho con cariño por tu esposa ❄",
  shuffleDoors: false, // true = casillas desordenadas como un calendario de verdad
};

window.DAYS = [
{
  day: 1, type: "wordsearch", title: "Empieza la magia",
  text: "Para abrir el primer regalo, resuelve cada pista y encuentra la respuesta en la sopa de letras. Arrastra el dedo sobre las letras, o toca la primera y la última.",
  words: [
    { word: "Bruja",     clue: "El primer apodo que me pusiste y me recuerdas constantemente" },
    { word: "Agosto",    clue: "Mes en el cual nos convertimos en novias" },
    { word: "Hermosa",   clue: "Lo que pienso cada vez que observo una foto tuya" },
    { word: "Nessyr",    clue: "Nombre de nuestra hija (racha)" },
    { word: "Te amo",    clue: "Frase que decimos un millón de veces cada día" },
    { word: "Boda",      clue: "Un futuro que me gusta imaginar contigo" },
    { word: "Tulipanes", clue: "La flor que te regalaría cualquier día sin motivo" },
    { word: "Amor",      clue: "Lo que siento por ti cada día" },
  ],
  size: 10,
  easy: false,
  reward: "Cada día de aquí a Navidad habrá una sorpresa nueva esperándote. Para canjear el primer premio escribe en nuestro chat el código: BRUJA17",
},
  {
    day: 2, type: "scratch", title: "Raspa y gana",
  prize: "Cupón válido para apradrinar un pingüino juntas y que tú escojas el nombre.", icon: "🎟️", detail: "Este mes se habilita la campaña.",
  },
  {
    day: 3, type: "hangman", title: "Adivina la frase",
  phrase: "Eres mi mejor regalo", hint: "No se compra, no se envuelve y no está bajo el árbol… pero es lo que más ilusión me haría tener siempre.", lives: 8,
  reward: "Gracias por convertir esta navidad en la más especial de mi vida.",
  },
{
  day: 4, type: "song", title: "El sonido de mi corazón",
  url: "https://www.youtube.com/watch?v=arNwkrw8CKU",
  cover: "fotos/portada-album.jpg",
  songTitle: "Sweet love",
  artist: "Anita Baker",
  text: "Esta canción me recuerda a ti y lo meloso que es nuestro amor.",
},
  {
    day: 5, type: "riddle", title: "Un pequeño acertijo",
    question: "Tengo brillo pero no soy una estrella, nazco en ti pero vivo en mi corazón. No cuesto nada, pero para mí lo es todo. ¿Qué soy?",
    answers: ["risa", "tu risa"],
    hint: "suena cuando te cuento un chiste malo.",
    reward: "¡Lo lograste! Esta casilla escondía un abrazo largo, largo, largo.",
  },
  {
    day: 6, type: "message", title: "Tres cosas que me encantan de ti",
    text: "1. Amo que seas la persona más bondadosa de este planeta, que te duela el mundo y salgas a defenderlo, pero aun así tengas espacio en tu corazón para ser la más cursi conmigo.\n2. Adoro que tu risa sea mi debilidad absoluta; me encanta saber que soy capaz de provocarla con mis tonterías porque ese sonido tuyo tiene el poder mágico de hacerme sentir la mujer más afortunado del universo.\n3. Me fascina que seas la persona más sabia que conozco y que uses tu inteligencia para entender el mundo, empatizar con los demás y aportar soluciones sin buscar aplausos.\n\n",
  },
  {
  day: 7, type: "video", title: "Enamorarme de ti",
  url: "https://www.youtube.com/watch?v=ZEzr6RE7QK0&t=584s",
  cover: "fotos/Pluto.png",
  songTitle: "",
  artist: "Pluto",
  text: "Te dedico la escena desde 9:24 min - 11:40 min",
  },
  {
    day: 8, type: "coupon", title: "Un cupón para ti",
    offer: "Vale por decorar juntas un árbol virtual",
    conditions: "Creamos un árbol de Navidad en una pizarra compartida (Canva) y lo decoramos cada una desde su casa. Luego lo guardamos como recuerdo.",
  },
  {
  day: 9, type: "song", title: "Para bailar en la cocina",
  url: "https://www.youtube.com/watch?v=moD7Pg_HUxg",
  cover: "fotos/Grupo-galee.png",
  songTitle: "Amor, cuánto te amo",
  artist: "Diego Galé y Grupo Galé",
  text: "Otra canción que te dedico y podremos bailar juntas mientras nos profesamos nuestro amor.",
  },
  {
    day: 10, type: "photo", title: "Siempre te necesito",
    image: "fotos/Virginia.png",
    text: "Te llevo grabada en lo profundo de mi alma en cada instante del día.",
  },
  {
    day: 11, type: "riddle", title: "¿Cuánto me conoces?",
    question: "¿Cuál fue el ingrediente secreto de la poción que usé para hacerte mi amarre de bruja?",
    answers: ["agua de calzón"],
    hint: "Es mi poción mágica favorita, pero no se sirve en bares.",
    reward: "Me encanta que te acuerdes. Mañana habrá más.",
  },
  {
    day: 12, type: "puzzle", title: "Arma la imagen de nuestro futuro",
  image: "fotos/boda.png", size: 3,
  text: "Toca dos piezas para intercambiarlas de lugar.",
  reward: "¡Lo lograste, amor mío! Espero te haya gustado la frase que hice pensando en ti."
  },
  {
    day: 13, type: "song", title: "Te adoro mi hermosa esposa",
  url: "https://www.youtube.com/watch?v=S8U762JByAk",
  cover: "fotos/ciara.png",
  songTitle: "Beauty Marks",
  artist: "Ciara",
  text: "Antes te conté que imaginaba una boda con el amor de mi vida y esta canción. Ahora sé que el amor de mi vida eres tú y solo anhelo convertirme en tu esposa.",
  },
  {
    day: 14, type: "bunny", title: "Un ramo para ti",
  greeting: "Mi amor,",
  letter: "Como dos conejas que encuentran su madriguera entre tulipanes, tú y yo hemos hallado un amor verdadero que no se marchita y se elige con la certeza de que ninguna primavera será igual sin el latido de la otra.\n\n",
  closing: "Te ama con toda su alma,", from: "Pat",
  },
  {
    day: 15, type: "scratch", title: "Raspa y gana",
  prize: "Una cita sorpresa y al final del día bailaremos juntas la canción que tú elijas.", icon: "🎟️", detail: "Válida en marzo",
  },
  {
    day: 16, type: "catch", title: "Atrapa mi amor",
  duration: 20,
  items: ["💗", "💖", "⭐"],
  messages: ["¡Eres increíble!", "¡Te amo!", "¡Qué rapidos dedos!"],
  endMessage: "¡Eres la mejor!",
  },
  {
     day: 17, type: "platformer", title: "Ayuda a Pat",
  heroName: "Pat",
  text: "Ayuda a Pat a llegar hasta su princesa. Salta los obstáculos y pisa a los enemigos.",
  // opcionales: winMessage, reward, rewardImage
  },
  {
day: 18, type: "wheel", title: "La rueda del amor",
  prizes: [
    "Un millón de besos",
    "Comprarte ropa",
    "Un masaje",
    "Regalarte uno de mis labiales",
    "Comprarte un libro",
    { label: "Adoptar un conejo juntas", detail: "Nuestro primer hijo peludo, a elegir juntas" },
    "Un abrazo largo",
  ],
  result: "Adoptar un conejo juntas 🐰",
  spins: 1,
  buttonLabel: "¡Girar la rueda!",
  text: "Gira la rueda y descubre tu premio de hoy.",
  spins: 1
  },
  {
    day: 19, type: "book", title: "Una frase para ti",
  bookTitle: "A Virginia le gustaba Vita",
  author: "Pilar Bellver",
  cover: "fotos/Vita.jpg",
  quote: "Tu inteligencia es un acicate para la mía. Te amo porque te admiro y te deseo porque me impresionas.",
  },
  {
    day: 20, type: "snowglobe", title: "Nuestra bola de nieve",
  text: "Agítala y mira caer la nieve.",
  label: "Feliz Navidad",
  message: "Tú y yo, en nuestra propia burbuja de Navidad.",
  icon: "🔮",
  },
  {
    day: 21, type: "binary", title: "Un mensaje secreto",
  message: "Te amo",
  text: "Alguien te dejó un mensaje en código binario. ¿Puedes descifrarlo?",
  clue: "Son dos palabras cortas que nos decimos todos los días",
  hints: [
    "Cada grupo de 8 números es UNA letra.",
    "Las posiciones valen 128, 64, 32, 16, 8, 4, 2 y 1.",
    "Ejemplo: 01010100 = 64 + 16 + 4 = 84 = «T».",
    "Empieza con «T» y termina con «o».",
  ],
  reward: "Sí, te amo. Hoy y todos los días.",
  },
  {
    day: 22, type: "song", title: "Eres mi hogar seguro",
  url: "https://www.youtube.com/watch?v=1z_X5SG_K4I",
  cover: "fotos/cure.png",
  songTitle: "Lovesong",
  artist: "The Cure",
  text: "Y aún así todo lo que dice la canción queda corto comparado a lo que siento por ti.",
  },
  {
    day: 23, type: "stocking", title: "La media gigante", text: "Una media enorme, llena de dulces. Tócala.",
  },
  {
    day: 24, type: "letter", title: "Feliz Navidad, {forName}",
  heading: "Carta de Navidad",
  greeting: "Mi amor,",
  letter: `Desde que era pequeña, la Navidad nunca me emocionó. De todas las festividades, era la que me hacía darme cuenta de lo poco importante que resultaba para las personas a mi alrededor. Durante años le escribí cartas a Santa; las escribía con ilusión, pero eran ignoradas y terminaban en la basura, hasta que un día decidí no intentarlo más.
  Cada luz que veía por la ventana me evocaba una alegría mágica, con sus sonidos y su promesa de calidez. La Navidad siempre sonaba tan cálida y reconfortante, como algo a lo que aspiraba, pero que no podía alcanzar. No recuerdo una festividad familiar que no estuviera plagada de problemas y que no terminara en caos. Hasta que llegó un punto en que dejamos de festejarla y pasó a ser un día cualquiera.
  Llegué a pensar que nunca más encontraría una razón para emocionarme por esta festividad, hasta que apareciste en mi vida.
  De repente, cada villancico, cada luz y cada esfera del árbol empezó a tener brillo para mí, porque pensaba en la persona más importante de mi vida y en lo mucho que deseaba festejar cada Navidad junto a ella. Me emocionan todos los planes que tenemos y las ideas que guardamos en Pinterest para decorar el árbol, elegir los adornos y los platos; cada detalle me emociona cada vez que lo recuerdo.
  Gracias por encender una luz en mi vida; por brindarme la mejor Navidad incluso a la distancia; por quedarte a mi lado y por darme el regalo más grande: tu amor.
  Ya no espero la Navidad como antes, porque ahora la espero contigo. La espero en cada plan que imaginamos, en cada adorno que elegiremos y en cada mesa que algún día compartiremos. Gracias por devolverme la ilusión y por convertir lo que antes era ausencia en la promesa más hermosa: una vida celebrando a tu lado.`,
  closing: "Feliz Navidad, con todo mi amor,",
  from: "Pat",
  ps: "P.D. Te amo musho musho musho.",
  image: "fotos/lov.jpg",
  icon: "🎄",
  },
];
