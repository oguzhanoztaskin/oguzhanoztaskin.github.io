// js/flashcard.js
// Flashcard modu mantığı

const FlashcardModule = (() => {
  let deck = [];
  let current = 0;
  let mode = 'de-tr';
  let correct = 0;
  let wrong = 0;
  let flipped = false;
  let stars = new Set(JSON.parse(localStorage.getItem('starred') || '[]'));

  const cardEl    = document.getElementById('flashcard');
  const frontLang = document.getElementById('front-lang');
  const frontWord = document.getElementById('front-word');
  const frontArt  = document.getElementById('front-article');
  const backLang  = document.getElementById('back-lang');
  const backWord  = document.getElementById('back-word');
  const backArt   = document.getElementById('back-article');
  const backEx    = document.getElementById('back-example');
  const actionBtns = document.getElementById('action-buttons');
  const progressBar = document.getElementById('progress-bar');
  const progressLbl = document.getElementById('progress-label');
  const scoreLbl    = document.getElementById('score-label');
  const btnStar     = document.getElementById('btn-star');

  function saveStars() {
    localStorage.setItem('starred', JSON.stringify([...stars]));
  }

  function getDirection(word) {
    if (mode === 'de-tr') return 'de-tr';
    if (mode === 'tr-de') return 'tr-de';
    // mixed: random per card
    return word._dir || (word._dir = Math.random() < 0.5 ? 'de-tr' : 'tr-de');
  }

  function renderCard() {
    if (current >= deck.length) { return; }
    const word = deck[current];
    const dir  = getDirection(word);
    flipped = false;
    cardEl.classList.remove('flipped');
    actionBtns.classList.add('hidden');

    if (dir === 'de-tr') {
      frontLang.textContent = '🇩🇪 Almanca';
      frontWord.textContent = word.de;
      frontArt.textContent  = word.article ? `(${word.article})` : '';
      backLang.textContent  = '🇹🇷 Türkçe';
      backWord.textContent  = word.tr;
      backArt.textContent   = '';
    } else {
      frontLang.textContent = '🇹🇷 Türkçe';
      frontWord.textContent = word.tr;
      frontArt.textContent  = '';
      backLang.textContent  = '🇩🇪 Almanca';
      backWord.textContent  = word.de;
      backArt.textContent   = word.article ? `(${word.article})` : '';
    }
    backEx.textContent = word.example || '';

    const key = word.de;
    btnStar.textContent = stars.has(key) ? '★' : '☆';
    btnStar.classList.toggle('starred', stars.has(key));

    updateProgress();
  }

  function updateProgress() {
    const total = deck.length;
    const pct   = total > 0 ? Math.round(((current) / total) * 100) : 0;
    progressBar.style.width = pct + '%';
    progressLbl.textContent = `${current + 1} / ${total}`;
    scoreLbl.innerHTML = `✅ ${correct} &nbsp; ❌ ${wrong}`;
  }

  function flipCard() {
    if (flipped) return;
    flipped = true;
    cardEl.classList.add('flipped');
    actionBtns.classList.remove('hidden');
  }

  function markCorrect() {
    if (!flipped) return;
    correct++;
    deck[current]._result = 'correct';
    cardEl.classList.add('pop');
    setTimeout(() => { cardEl.classList.remove('pop'); nextCard(); }, 300);
  }

  function markWrong() {
    if (!flipped) return;
    wrong++;
    deck[current]._result = 'wrong';
    cardEl.classList.add('shake');
    setTimeout(() => { cardEl.classList.remove('shake'); nextCard(); }, 400);
  }

  function nextCard() {
    if (current + 1 >= deck.length) {
      AppState.showResults({ correct, wrong, deck, mode });
      return;
    }
    current++;
    renderCard();
  }

  function prevCard() {
    if (current > 0) {
      current--;
      renderCard();
    }
  }

  function toggleStar() {
    const key = deck[current].de;
    if (stars.has(key)) {
      stars.delete(key);
      btnStar.textContent = '☆';
      btnStar.classList.remove('starred');
    } else {
      stars.add(key);
      btnStar.textContent = '★';
      btnStar.classList.add('starred');
    }
    saveStars();
  }

  function start(wordList, selectedMode) {
    deck    = wordList.map(w => ({ ...w })); // clone
    mode    = selectedMode;
    current = 0;
    correct = 0;
    wrong   = 0;
    renderCard();
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (!document.getElementById('screen-flashcard').classList.contains('active')) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipCard(); }
    if (e.key === 'ArrowRight' || e.key === 'l') markCorrect();
    if (e.key === 'ArrowLeft'  || e.key === 'j') markWrong();
    if (e.key === 's') toggleStar();
  });

  // Card click to flip
  document.getElementById('card-scene').addEventListener('click', flipCard);

  // Action buttons
  document.getElementById('btn-correct').addEventListener('click', markCorrect);
  document.getElementById('btn-wrong').addEventListener('click', markWrong);
  document.getElementById('btn-star').addEventListener('click', e => { e.stopPropagation(); toggleStar(); });
  document.getElementById('btn-next').addEventListener('click', () => {
    if (flipped) nextCard(); else flipCard();
  });
  document.getElementById('btn-prev').addEventListener('click', prevCard);

  return { start, getStars: () => stars };
})();
