// js/quiz.js
// Test modu mantığı (4 şıklı çoktan seçmeli)

const QuizModule = (() => {
  let deck    = [];
  let current = 0;
  let correct = 0;
  let wrong   = 0;
  let mode    = 'de-tr'; // used for question direction; mixed = random

  const quizLang   = document.getElementById('quiz-lang');
  const quizWord   = document.getElementById('quiz-word');
  const optionsEl  = document.getElementById('quiz-options');
  const progressBar = document.getElementById('quiz-progress-bar');
  const progressLbl = document.getElementById('quiz-progress-label');
  const scoreLbl    = document.getElementById('quiz-score-label');

  function getDir(word) {
    if (mode === 'de-tr') return 'de-tr';
    if (mode === 'tr-de') return 'tr-de';
    return word._dir || (word._dir = Math.random() < 0.5 ? 'de-tr' : 'tr-de');
  }

  function getWrongOptions(correct, dir) {
    const pool = WORDS.filter(w => w.de !== deck[current].de);
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);
    return shuffled.map(w => dir === 'de-tr' ? w.tr : w.de);
  }

  function renderQuestion() {
    if (current >= deck.length) {
      AppState.showResults({ correct, wrong, deck, mode });
      return;
    }
    const word = deck[current];
    const dir  = getDir(word);

    if (dir === 'de-tr') {
      quizLang.textContent = '🇩🇪 Almanca — Bu kelimenin Türkçesi nedir?';
      quizWord.textContent = word.de + (word.article ? ` (${word.article})` : '');
    } else {
      quizLang.textContent = '🇹🇷 Türkçe — Bu kelimenin Almancası nedir?';
      quizWord.textContent = word.tr;
    }

    const correctAnswer = dir === 'de-tr' ? word.tr : word.de;
    const wrongs = getWrongOptions(correctAnswer, dir);
    const options = [correctAnswer, ...wrongs].sort(() => Math.random() - 0.5);

    optionsEl.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleAnswer(btn, opt, correctAnswer));
      optionsEl.appendChild(btn);
    });

    updateProgress();
  }

  function handleAnswer(btn, chosen, answer) {
    // Disable all
    optionsEl.querySelectorAll('.quiz-option').forEach(b => { b.disabled = true; });

    if (chosen === answer) {
      btn.classList.add('correct');
      correct++;
      deck[current]._result = 'correct';
      setTimeout(nextQuestion, 900);
    } else {
      btn.classList.add('wrong');
      wrong++;
      deck[current]._result = 'wrong';
      // Show correct answer
      optionsEl.querySelectorAll('.quiz-option').forEach(b => {
        if (b.textContent === answer) b.classList.add('correct');
      });
      setTimeout(nextQuestion, 1400);
    }
    updateProgress();
  }

  function nextQuestion() {
    current++;
    renderQuestion();
  }

  function updateProgress() {
    const total = deck.length;
    const pct   = total > 0 ? Math.round((current / total) * 100) : 0;
    progressBar.style.width = pct + '%';
    progressLbl.textContent = `${Math.min(current + 1, total)} / ${total}`;
    scoreLbl.innerHTML = `✅ ${correct} &nbsp; ❌ ${wrong}`;
  }

  function start(wordList, selectedMode) {
    deck    = wordList.map(w => ({ ...w }));
    mode    = selectedMode;
    current = 0;
    correct = 0;
    wrong   = 0;
    renderQuestion();
  }

  return { start };
})();
