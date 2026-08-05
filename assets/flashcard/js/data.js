// js/data.js
// Almanca – Türkçe kelime veri tabanı

const WORDS = [
  // ── Temel Kelimeler ──────────────────────────────────────────
  { de: "Hallo",        tr: "Merhaba",          article: "",      category: "Temel",     example: "Hallo, wie geht es dir?" },
  { de: "Auf Wiedersehen", tr: "Hoşça kal / Görüşürüz", article: "", category: "Temel", example: "Auf Wiedersehen!" },
  { de: "Danke",        tr: "Teşekkürler",      article: "",      category: "Temel",     example: "Danke schön!" },
  { de: "Bitte",        tr: "Lütfen / Rica ederim", article: "", category: "Temel",     example: "Bitte hilf mir!" },
  { de: "Ja",           tr: "Evet",              article: "",      category: "Temel",     example: "Ja, natürlich." },
  { de: "Nein",         tr: "Hayır",             article: "",      category: "Temel",     example: "Nein, das stimmt nicht." },
  { de: "Entschuldigung", tr: "Özür dilerim / Affedersiniz", article: "", category: "Temel", example: "Entschuldigung, wo ist der Bahnhof?" },
  { de: "Wie geht es Ihnen?", tr: "Nasılsınız?", article: "",    category: "Temel",     example: "Guten Tag! Wie geht es Ihnen?" },

  // ── Sayılar ──────────────────────────────────────────────────
  { de: "eins",         tr: "bir (1)",           article: "",      category: "Sayılar",   example: "Ich habe eins." },
  { de: "zwei",         tr: "iki (2)",            article: "",      category: "Sayılar",   example: "Zwei Kaffee, bitte." },
  { de: "drei",         tr: "üç (3)",             article: "",      category: "Sayılar",   example: "Drei Äpfel." },
  { de: "vier",         tr: "dört (4)",           article: "",      category: "Sayılar",   example: "Vier Personen." },
  { de: "fünf",         tr: "beş (5)",            article: "",      category: "Sayılar",   example: "Fünf Minuten." },
  { de: "zehn",         tr: "on (10)",            article: "",      category: "Sayılar",   example: "Zehn Euro." },
  { de: "zwanzig",      tr: "yirmi (20)",         article: "",      category: "Sayılar",   example: "Zwanzig Kilometer." },
  { de: "hundert",      tr: "yüz (100)",          article: "",      category: "Sayılar",   example: "Hundert Prozent." },

  // ── Renkler ──────────────────────────────────────────────────
  { de: "rot",          tr: "kırmızı",           article: "",      category: "Renkler",   example: "Das Auto ist rot." },
  { de: "blau",         tr: "mavi",              article: "",      category: "Renkler",   example: "Der Himmel ist blau." },
  { de: "grün",         tr: "yeşil",             article: "",      category: "Renkler",   example: "Das Gras ist grün." },
  { de: "gelb",         tr: "sarı",              article: "",      category: "Renkler",   example: "Die Sonne ist gelb." },
  { de: "schwarz",      tr: "siyah",             article: "",      category: "Renkler",   example: "Das Kleid ist schwarz." },
  { de: "weiß",         tr: "beyaz",             article: "",      category: "Renkler",   example: "Der Schnee ist weiß." },
  { de: "grau",         tr: "gri",               article: "",      category: "Renkler",   example: "Der Himmel ist grau." },
  { de: "orange",       tr: "turuncu",           article: "",      category: "Renkler",   example: "Die Orange ist orange." },
  { de: "lila",         tr: "mor",               article: "",      category: "Renkler",   example: "Die Blume ist lila." },
  { de: "braun",        tr: "kahverengi",        article: "",      category: "Renkler",   example: "Der Hund ist braun." },

  // ── Yiyecek & İçecek ─────────────────────────────────────────
  { de: "Brot",         tr: "ekmek",             article: "das",   category: "Yiyecek",   example: "Ich esse Brot zum Frühstück." },
  { de: "Wasser",       tr: "su",                article: "das",   category: "Yiyecek",   example: "Ich trinke Wasser." },
  { de: "Kaffee",       tr: "kahve",             article: "der",   category: "Yiyecek",   example: "Ich trinke jeden Morgen Kaffee." },
  { de: "Tee",          tr: "çay",               article: "der",   category: "Yiyecek",   example: "Möchten Sie Tee oder Kaffee?" },
  { de: "Milch",        tr: "süt",               article: "die",   category: "Yiyecek",   example: "Ich trinke Milch." },
  { de: "Fleisch",      tr: "et",                article: "das",   category: "Yiyecek",   example: "Ich esse kein Fleisch." },
  { de: "Fisch",        tr: "balık",             article: "der",   category: "Yiyecek",   example: "Fisch ist gesund." },
  { de: "Ei",           tr: "yumurta",           article: "das",   category: "Yiyecek",   example: "Ich esse zwei Eier." },
  { de: "Apfel",        tr: "elma",              article: "der",   category: "Yiyecek",   example: "Ein Apfel am Tag hält den Arzt fern." },
  { de: "Banane",       tr: "muz",               article: "die",   category: "Yiyecek",   example: "Ich esse eine Banane." },
  { de: "Kartoffel",    tr: "patates",           article: "die",   category: "Yiyecek",   example: "Kartoffeln sind sehr lecker." },
  { de: "Käse",         tr: "peynir",            article: "der",   category: "Yiyecek",   example: "Ich mag Käse sehr gern." },
  { de: "Zucker",       tr: "şeker",             article: "der",   category: "Yiyecek",   example: "Kaffee ohne Zucker, bitte." },
  { de: "Salz",         tr: "tuz",               article: "das",   category: "Yiyecek",   example: "Das Essen braucht mehr Salz." },

  // ── Aile ─────────────────────────────────────────────────────
  { de: "Mutter",       tr: "anne",              article: "die",   category: "Aile",      example: "Meine Mutter kocht gut." },
  { de: "Vater",        tr: "baba",              article: "der",   category: "Aile",      example: "Mein Vater arbeitet in Berlin." },
  { de: "Bruder",       tr: "erkek kardeş",      article: "der",   category: "Aile",      example: "Ich habe einen Bruder." },
  { de: "Schwester",    tr: "kız kardeş",        article: "die",   category: "Aile",      example: "Meine Schwester studiert Medizin." },
  { de: "Kind",         tr: "çocuk",             article: "das",   category: "Aile",      example: "Das Kind spielt im Garten." },
  { de: "Frau",         tr: "kadın / karı",      article: "die",   category: "Aile",      example: "Meine Frau heißt Anna." },
  { de: "Mann",         tr: "erkek / koca",      article: "der",   category: "Aile",      example: "Ihr Mann ist Arzt." },
  { de: "Großmutter",   tr: "büyükanne",         article: "die",   category: "Aile",      example: "Meine Großmutter ist 80 Jahre alt." },
  { de: "Großvater",    tr: "büyükbaba",         article: "der",   category: "Aile",      example: "Mein Großvater erzählt Geschichten." },

  // ── Zaman ────────────────────────────────────────────────────
  { de: "heute",        tr: "bugün",             article: "",      category: "Zaman",     example: "Heute ist Montag." },
  { de: "morgen",       tr: "yarın",             article: "",      category: "Zaman",     example: "Ich komme morgen." },
  { de: "gestern",      tr: "dün",               article: "",      category: "Zaman",     example: "Gestern war ich krank." },
  { de: "jetzt",        tr: "şimdi",             article: "",      category: "Zaman",     example: "Ich bin jetzt müde." },
  { de: "Morgen",       tr: "sabah",             article: "der",   category: "Zaman",     example: "Guten Morgen!" },
  { de: "Abend",        tr: "akşam",             article: "der",   category: "Zaman",     example: "Guten Abend!" },
  { de: "Nacht",        tr: "gece",              article: "die",   category: "Zaman",     example: "Gute Nacht!" },
  { de: "Woche",        tr: "hafta",             article: "die",   category: "Zaman",     example: "Diese Woche bin ich beschäftigt." },
  { de: "Monat",        tr: "ay",                article: "der",   category: "Zaman",     example: "Im Monat Januar ist es kalt." },
  { de: "Jahr",         tr: "yıl",               article: "das",   category: "Zaman",     example: "Das Jahr hat 12 Monate." },
  { de: "Uhr",          tr: "saat",              article: "die",   category: "Zaman",     example: "Wie viel Uhr ist es?" },

  // ── Mekanlar ─────────────────────────────────────────────────
  { de: "Schule",       tr: "okul",              article: "die",   category: "Mekan",     example: "Ich gehe zur Schule." },
  { de: "Bahnhof",      tr: "tren istasyonu",    article: "der",   category: "Mekan",     example: "Der Bahnhof ist sehr groß." },
  { de: "Krankenhaus",  tr: "hastane",           article: "das",   category: "Mekan",     example: "Er liegt im Krankenhaus." },
  { de: "Supermarkt",   tr: "süpermarket",       article: "der",   category: "Mekan",     example: "Ich gehe in den Supermarkt." },
  { de: "Bibliothek",   tr: "kütüphane",         article: "die",   category: "Mekan",     example: "Ich lerne in der Bibliothek." },
  { de: "Apotheke",     tr: "eczane",            article: "die",   category: "Mekan",     example: "Die Apotheke ist um die Ecke." },
  { de: "Bank",         tr: "banka",             article: "die",   category: "Mekan",     example: "Ich muss zur Bank gehen." },
  { de: "Flughafen",    tr: "havalimanı",        article: "der",   category: "Mekan",     example: "Der Flughafen ist weit." },
  { de: "Restaurant",   tr: "restoran",          article: "das",   category: "Mekan",     example: "Gehen wir ins Restaurant?" },
  { de: "Hotel",        tr: "otel",              article: "das",   category: "Mekan",     example: "Das Hotel ist sehr schön." },

  // ── Fiiller ──────────────────────────────────────────────────
  { de: "gehen",        tr: "gitmek",            article: "",      category: "Fiiller",   example: "Ich gehe in die Schule." },
  { de: "kommen",       tr: "gelmek",            article: "",      category: "Fiiller",   example: "Er kommt aus der Türkei." },
  { de: "essen",        tr: "yemek",             article: "",      category: "Fiiller",   example: "Wir essen zusammen." },
  { de: "trinken",      tr: "içmek",             article: "",      category: "Fiiller",   example: "Ich trinke Wasser." },
  { de: "schlafen",     tr: "uyumak",            article: "",      category: "Fiiller",   example: "Das Baby schläft." },
  { de: "arbeiten",     tr: "çalışmak",          article: "",      category: "Fiiller",   example: "Ich arbeite in Berlin." },
  { de: "sprechen",     tr: "konuşmak",          article: "",      category: "Fiiller",   example: "Ich spreche Deutsch." },
  { de: "lesen",        tr: "okumak",            article: "",      category: "Fiiller",   example: "Ich lese ein Buch." },
  { de: "schreiben",    tr: "yazmak",            article: "",      category: "Fiiller",   example: "Ich schreibe einen Brief." },
  { de: "kaufen",       tr: "satın almak",       article: "",      category: "Fiiller",   example: "Ich kaufe ein neues Handy." },
  { de: "wohnen",       tr: "oturmak / yaşamak", article: "",     category: "Fiiller",   example: "Ich wohne in München." },
  { de: "lieben",       tr: "sevmek",            article: "",      category: "Fiiller",   example: "Ich liebe dich." },
  { de: "lernen",       tr: "öğrenmek",          article: "",      category: "Fiiller",   example: "Ich lerne Deutsch." },
  { de: "helfen",       tr: "yardım etmek",      article: "",      category: "Fiiller",   example: "Kannst du mir helfen?" },
  { de: "sehen",        tr: "görmek",            article: "",      category: "Fiiller",   example: "Ich sehe einen Film." },

  // ── Sıfatlar ─────────────────────────────────────────────────
  { de: "groß",         tr: "büyük",             article: "",      category: "Sıfatlar",  example: "Das Haus ist sehr groß." },
  { de: "klein",        tr: "küçük",             article: "",      category: "Sıfatlar",  example: "Das Kind ist noch klein." },
  { de: "alt",          tr: "yaşlı / eski",      article: "",      category: "Sıfatlar",  example: "Das ist ein altes Buch." },
  { de: "neu",          tr: "yeni",              article: "",      category: "Sıfatlar",  example: "Ich habe ein neues Auto." },
  { de: "gut",          tr: "iyi",               article: "",      category: "Sıfatlar",  example: "Das Essen ist sehr gut." },
  { de: "schlecht",     tr: "kötü",              article: "",      category: "Sıfatlar",  example: "Das Wetter ist schlecht." },
  { de: "schön",        tr: "güzel",             article: "",      category: "Sıfatlar",  example: "Das ist ein schöner Tag." },
  { de: "schnell",      tr: "hızlı",             article: "",      category: "Sıfatlar",  example: "Das Auto fährt schnell." },
  { de: "langsam",      tr: "yavaş",             article: "",      category: "Sıfatlar",  example: "Sprich bitte langsamer." },
  { de: "teuer",        tr: "pahalı",            article: "",      category: "Sıfatlar",  example: "Das ist sehr teuer." },
  { de: "billig",       tr: "ucuz",              article: "",      category: "Sıfatlar",  example: "Das Ticket ist billig." },
  { de: "müde",         tr: "yorgun / uykulu",   article: "",      category: "Sıfatlar",  example: "Ich bin sehr müde." },
  { de: "krank",        tr: "hasta",             article: "",      category: "Sıfatlar",  example: "Er ist krank und bleibt zu Hause." },
  { de: "glücklich",    tr: "mutlu",             article: "",      category: "Sıfatlar",  example: "Ich bin sehr glücklich." },
  { de: "traurig",      tr: "üzgün",             article: "",      category: "Sıfatlar",  example: "Warum bist du so traurig?" },

  // ── Vücut ─────────────────────────────────────────────────────
  { de: "Kopf",         tr: "kafa / baş",        article: "der",   category: "Vücut",     example: "Mein Kopf tut weh." },
  { de: "Hand",         tr: "el",                article: "die",   category: "Vücut",     example: "Wasch dir die Hände!" },
  { de: "Auge",         tr: "göz",               article: "das",   category: "Vücut",     example: "Er hat blaue Augen." },
  { de: "Ohr",          tr: "kulak",             article: "das",   category: "Vücut",     example: "Ich kann dich nicht hören." },
  { de: "Nase",         tr: "burun",             article: "die",   category: "Vücut",     example: "Meine Nase läuft." },
  { de: "Mund",         tr: "ağız",              article: "der",   category: "Vücut",     example: "Öffne den Mund bitte." },
  { de: "Bein",         tr: "bacak",             article: "das",   category: "Vücut",     example: "Mein Bein tut weh." },
  { de: "Fuß",          tr: "ayak",              article: "der",   category: "Vücut",     example: "Mein Fuß schmerzt." },

  // ── Hava Durumu ───────────────────────────────────────────────
  { de: "Sonne",        tr: "güneş",             article: "die",   category: "Hava",      example: "Die Sonne scheint." },
  { de: "Regen",        tr: "yağmur",            article: "der",   category: "Hava",      example: "Es gibt viel Regen." },
  { de: "Schnee",       tr: "kar",               article: "der",   category: "Hava",      example: "Im Winter schneit es." },
  { de: "Wind",         tr: "rüzgar",            article: "der",   category: "Hava",      example: "Der Wind ist stark." },
  { de: "Wolke",        tr: "bulut",             article: "die",   category: "Hava",      example: "Heute gibt es viele Wolken." },
  { de: "heiß",         tr: "sıcak",             article: "",      category: "Hava",      example: "Es ist heute sehr heiß." },
  { de: "kalt",         tr: "soğuk",             article: "",      category: "Hava",      example: "Im Winter ist es kalt." },
];

// Tüm kategorileri çıkar
const CATEGORIES = ["Tümü", ...new Set(WORDS.map(w => w.category))];
