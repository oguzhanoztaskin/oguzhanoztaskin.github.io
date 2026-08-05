// js/app.js
// Ana uygulama — ekran yönetimi ve başlatma

const AppState = (() => {
  let selectedMode = 'de-tr';
  let selectedCategories = new Set(['Tümü']);
  let lastDeck  = [];
  let lastMode  = 'de-tr';

  // ── Ekran Yönetimi ────────────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // ── Kategori Filtreleri ───────────────────────────────────────
  const filtersEl = document.getElementById('category-filters');

  CATEGORIES.forEach(cat => {
    const chip = document.createElement('button');
    chip.className = 'cat-chip' + (cat === 'Tümü' ? ' active' : '');
    chip.textContent = cat;
    chip.dataset.cat = cat;
    chip.addEventListener('click', () => toggleCategory(cat, chip));
    filtersEl.appendChild(chip);
  });

  function toggleCategory(cat, chip) {
    if (cat === 'Tümü') {
      selectedCategories = new Set(['Tümü']);
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.toggle('active', c.dataset.cat === 'Tümü'));
      return;
    }
    // Deselect "Tümü"
    selectedCategories.delete('Tümü');
    document.querySelector('.cat-chip[data-cat="Tümü"]').classList.remove('active');

    if (selectedCategories.has(cat)) {
      selectedCategories.delete(cat);
      chip.classList.remove('active');
      if (selectedCategories.size === 0) {
        selectedCategories.add('Tümü');
        document.querySelector('.cat-chip[data-cat="Tümü"]').classList.add('active');
      }
    } else {
      selectedCategories.add(cat);
      chip.classList.add('active');
    }
  }

  // ── Mod Seçimi ────────────────────────────────────────────────
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMode = btn.dataset.mode;
    });
  });
  // Default seçim
  document.querySelector('.mode-btn[data-mode="de-tr"]').classList.add('selected');

  // ── Deck Oluştur ──────────────────────────────────────────────
  function buildDeck() {
    const starsOnly = document.getElementById('starred-only').checked;
    const shuffle   = document.getElementById('shuffle-toggle').checked;
    const stars     = FlashcardModule.getStars();

    let words = WORDS.filter(w => {
      const catOk  = selectedCategories.has('Tümü') || selectedCategories.has(w.category);
      const starOk = !starsOnly || stars.has(w.de);
      return catOk && starOk;
    });

    if (words.length === 0) {
      alert('Seçili filtrelere uygun kelime bulunamadı. Filtrelerinizi genişletin.');
      return null;
    }

    if (shuffle) {
      words = words.sort(() => Math.random() - 0.5);
    }

    return words;
  }

  // ── Başlat ────────────────────────────────────────────────────
  document.getElementById('btn-start').addEventListener('click', () => {
    const deck = buildDeck();
    if (!deck) return;

    lastDeck = deck;
    lastMode = selectedMode;

    if (selectedMode === 'quiz') {
      showScreen('screen-quiz');
      QuizModule.start(deck, 'de-tr'); // quiz internally mixes
    } else {
      showScreen('screen-flashcard');
      FlashcardModule.start(deck, selectedMode);
    }
  });

  // ── Ana Menü Butonları ────────────────────────────────────────
  document.getElementById('btn-home-fc').addEventListener('click', () => showScreen('screen-home'));
  document.getElementById('btn-home-quiz').addEventListener('click', () => showScreen('screen-home'));
  document.getElementById('btn-results-home').addEventListener('click', () => showScreen('screen-home'));

  // ── Sonuçlar ──────────────────────────────────────────────────
  function showResults({ correct, wrong, deck, mode }) {
    const total = correct + wrong;
    const pct   = total > 0 ? Math.round((correct / total) * 100) : 0;

    document.getElementById('res-correct').textContent = correct;
    document.getElementById('res-wrong').textContent   = wrong;
    document.getElementById('res-pct').textContent     = pct + '%';

    let emoji, msg;
    if (pct === 100) { emoji = '🏆'; msg = 'Mükemmel! Hiç hata yapmadın!'; }
    else if (pct >= 80) { emoji = '🎉'; msg = 'Harika! Çok iyi bir sonuç!'; }
    else if (pct >= 60) { emoji = '👍'; msg = 'İyi iş! Biraz daha pratik yapabilirsin.'; }
    else if (pct >= 40) { emoji = '📚'; msg = 'Daha fazla tekrar gerekiyor.'; }
    else { emoji = '💪'; msg = 'Devam et, pratik seni geliştiriyor!'; }

    document.getElementById('results-emoji').textContent = emoji;
    document.getElementById('res-message').textContent   = msg;

    lastDeck = deck;
    lastMode = mode;

    showScreen('screen-results');
  }

  // ── Tekrar Dene ───────────────────────────────────────────────
  document.getElementById('btn-retry').addEventListener('click', () => {
    const deck = buildDeck();
    if (!deck) return;
    if (lastMode === 'quiz') {
      showScreen('screen-quiz');
      QuizModule.start(deck, lastMode);
    } else {
      showScreen('screen-flashcard');
      FlashcardModule.start(deck, lastMode);
    }
  });

  // ── Sadece Yanlışlar ─────────────────────────────────────────
  document.getElementById('btn-wrong-only').addEventListener('click', () => {
    const wrongDeck = lastDeck.filter(w => w._result === 'wrong');
    if (wrongDeck.length === 0) {
      alert('Yanlış yaptığın kelime yok! 🎉');
      return;
    }
    if (lastMode === 'quiz') {
      showScreen('screen-quiz');
      QuizModule.start(wrongDeck, lastMode);
    } else {
      showScreen('screen-flashcard');
      FlashcardModule.start(wrongDeck, lastMode);
    }
  });

  return { showResults, showScreen };
})();
