// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'schooltoets_v2';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (!data.stats) data.stats = {};
      return data;
    }
  } catch (_) {}
  return defaultData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function defaultData() {
  return {
    subjects: [
      {
        id: 'wiskunde', name: 'Wiskunde', emoji: '🔢',
        questions: [
          { id: 'w1', type: 'mc', question: 'Wat is 7 × 8?', options: ['54', '56', '48', '63'], correct: 1 },
          { id: 'w2', type: 'mc', question: 'Hoeveel graden heeft een rechthoek?', options: ['90°', '180°', '360°', '45°'], correct: 0 },
          { id: 'w3', type: 'open', question: 'Wat is de wortel van 144?', answer: '12', altAnswers: [] },
          { id: 'w4', type: 'truefalse', question: 'Het getal π (pi) is een rationeel getal.', correct: false },
          { id: 'w5', type: 'mc', question: 'Wat is 15% van 200?', options: ['25', '30', '35', '20'], correct: 1 },
          { id: 'w6', type: 'open', question: 'Hoeveel zijden heeft een hexagon?', answer: '6', altAnswers: ['zes'] },
        ]
      },
      {
        id: 'aardrijkskunde', name: 'Aardrijkskunde', emoji: '🌍',
        questions: [
          { id: 'a1', type: 'mc', question: 'Wat is de hoofdstad van Australië?', options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], correct: 2 },
          { id: 'a2', type: 'truefalse', question: 'De Nijl is de langste rivier ter wereld.', correct: true },
          { id: 'a3', type: 'mc', question: 'Op welk continent ligt de Sahara?', options: ['Azië', 'Afrika', 'Zuid-Amerika', 'Australië'], correct: 1 },
          { id: 'a4', type: 'open', question: 'Hoeveel continenten zijn er op aarde?', answer: '7', altAnswers: ['zeven'] },
          { id: 'a5', type: 'mc', question: 'Welke oceaan is de grootste ter wereld?', options: ['Atlantische', 'Indische', 'Arctische', 'Stille'], correct: 3 },
        ]
      },
    ],
    stats: {}
  };
}

// ── State ─────────────────────────────────────────────────────────────────────

let db = loadData();
let activeSubjectId = null;
let quiz = null;
let flashcard = null;

// ── Utility ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(str) {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/['']/g, '')            // strip apostrophes
    .replace(/[.,!?;:]/g, '');       // strip punctuation
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function recordStat(subjectId, questionId, correct) {
  if (!db.stats[subjectId]) db.stats[subjectId] = {};
  if (!db.stats[subjectId][questionId]) db.stats[subjectId][questionId] = { attempts: 0, correct: 0 };
  db.stats[subjectId][questionId].attempts++;
  if (correct) db.stats[subjectId][questionId].correct++;
  saveData();
}

function masteryPct(subjectId) {
  const subject = db.subjects.find(s => s.id === subjectId);
  if (!subject || subject.questions.length === 0) return 0;
  const subStats = db.stats[subjectId] || {};
  const mastered = subject.questions.filter(q => {
    const s = subStats[q.id];
    return s && s.correct > 0;
  }).length;
  return Math.round((mastered / subject.questions.length) * 100);
}

function masteryColor(pct) {
  if (pct >= 80) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
}

// ── Screens ───────────────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Sync built-in subjects from data/subjects.json ────────────────────────────

async function syncBuiltinSubjects() {
  try {
    const res = await fetch('data/subjects.json');
    if (!res.ok) return;
    const { subjects } = await res.json();
    const existingIds = new Set(db.subjects.map(s => s.id));
    let changed = false;
    subjects.forEach(subject => {
      if (!existingIds.has(subject.id)) {
        db.subjects.unshift(subject);
        changed = true;
      }
    });
    if (changed) { saveData(); renderHome(); }
  } catch (_) {}
}

// ── Home ──────────────────────────────────────────────────────────────────────

function renderHome() {
  const grid = document.getElementById('subject-grid');
  grid.innerHTML = '';

  if (db.subjects.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:32px 0">Geen vakken. Voeg er een toe via "Vragen beheren".</p>';
    return;
  }

  db.subjects.forEach(subject => {
    const pct = masteryPct(subject.id);
    const color = masteryColor(pct);
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.innerHTML = `
      <span class="emoji">${subject.emoji}</span>
      <div class="name">${subject.name}</div>
      <div class="count">${subject.questions.length} vragen</div>
      <div class="subject-progress-wrap">
        <div class="subject-progress-bar-bg">
          <div class="subject-progress-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="subject-progress-label">${pct > 0 ? pct + '% beheerst' : 'Nog niet geoefend'}</div>
      </div>`;
    card.addEventListener('click', () => {
      if (subject.questions.length === 0) { alert('Dit vak heeft nog geen vragen.'); return; }
      openModeSelect(subject.id);
    });
    grid.appendChild(card);
  });
}

// ── Mode select ───────────────────────────────────────────────────────────────

function openModeSelect(subjectId) {
  activeSubjectId = subjectId;
  const subject = db.subjects.find(s => s.id === subjectId);
  document.getElementById('mode-subject-heading').textContent = `${subject.emoji} ${subject.name}`;

  // Progress overview
  const overviewEl = document.getElementById('mode-progress-overview');
  const subStats = db.stats[subjectId] || {};
  const total = subject.questions.length;
  const attempted = subject.questions.filter(q => subStats[q.id]?.attempts > 0).length;
  const mastered  = subject.questions.filter(q => subStats[q.id]?.correct > 0).length;
  const openQs    = subject.questions.filter(q => q.type === 'open').length;
  const pct = masteryPct(subjectId);

  overviewEl.innerHTML = `
    <h4>📊 Jouw voortgang</h4>
    <div class="mprog-row">
      <span class="mprog-label">Beheerst</span>
      <div class="mprog-bar-bg"><div class="mprog-bar-fill" style="width:${pct}%;background:${masteryColor(pct)}"></div></div>
      <span class="mprog-pct" style="color:${masteryColor(pct)}">${pct}%</span>
    </div>
    <div style="font-size:.82rem;color:var(--text-muted);margin-top:4px">
      ${mastered} / ${total} vragen minstens één keer goed • ${attempted} geprobeerd
      ${openQs > 0 ? ` • ${openQs} typvragen` : ''}
    </div>`;

  // Disable typing mode if no open questions
  const typingBtn = document.getElementById('btn-mode-typing');
  if (openQs === 0) {
    typingBtn.disabled = true;
    typingBtn.querySelector('.mode-desc').textContent = 'Geen typvragen in dit vak';
  } else {
    typingBtn.disabled = false;
    typingBtn.querySelector('.mode-desc').textContent = 'Antwoorden invullen';
  }

  showScreen('screen-mode');
}

// ── Flashcards ────────────────────────────────────────────────────────────────

function startFlashcards(subjectId) {
  const subject = db.subjects.find(s => s.id === subjectId);
  flashcard = {
    subject,
    deck: shuffle(subject.questions),
    index: 0,
    known: 0,
    flipped: false,
  };
  document.getElementById('fc-subject-title').textContent = `${subject.emoji} ${subject.name}`;
  showScreen('screen-flashcard');
  renderFlashcard();
}

function renderFlashcard() {
  const { deck, index, known } = flashcard;
  const q = deck[index];
  const total = deck.length;

  document.getElementById('fc-progress').textContent = `Kaart ${index + 1} van ${total}`;
  document.getElementById('fc-known-count').textContent = `✅ ${known}`;
  document.getElementById('fc-progress-bar').style.width = `${(index / total) * 100}%`;

  // Front: question
  document.getElementById('fc-front').innerHTML =
    `<div class="fc-label">Vraag</div><div class="fc-content">${q.question}</div>`;

  // Back: answer
  const answerText = getAnswerDisplay(q);
  document.getElementById('fc-back').innerHTML =
    `<div class="fc-label">Antwoord</div><div class="fc-content">${answerText}</div>`;

  // Reset flip state
  const card = document.getElementById('flashcard');
  card.classList.remove('flipped');
  flashcard.flipped = false;

  document.getElementById('btn-fc-wrong').classList.add('hidden');
  document.getElementById('btn-fc-correct').classList.add('hidden');
  document.getElementById('fc-tap-hint').style.opacity = '1';
}

function getAnswerDisplay(q) {
  if (q.type === 'open') return q.answer;
  if (q.type === 'truefalse') return q.correct ? '✅ Waar' : '❌ Niet waar';
  if (q.type === 'mc') return q.options[q.correct];
  return '';
}

function flipFlashcard() {
  if (flashcard.flipped) return;
  flashcard.flipped = true;
  document.getElementById('flashcard').classList.add('flipped');
  document.getElementById('fc-tap-hint').style.opacity = '0';
  document.getElementById('btn-fc-wrong').classList.remove('hidden');
  document.getElementById('btn-fc-correct').classList.remove('hidden');
}

function markFlashcard(known) {
  const { subject, deck, index } = flashcard;
  const q = deck[index];
  recordStat(subject.id, q.id, known);
  if (known) flashcard.known++;

  flashcard.index++;
  if (flashcard.index >= flashcard.deck.length) {
    showFlashcardResults();
  } else {
    renderFlashcard();
  }
}

function showFlashcardResults() {
  const { known, deck, subject } = flashcard;
  const total = deck.length;
  const pct = Math.round((known / total) * 100);
  document.getElementById('results-title').textContent = 'Flashcards klaar!';
  document.getElementById('results-emoji').textContent = pct >= 80 ? '🏆' : pct >= 50 ? '🎉' : '💪';
  document.getElementById('results-score').textContent = `${pct}%`;
  document.getElementById('results-breakdown').textContent = `${known} van de ${total} kaarten gekend`;
  document.getElementById('btn-retry').onclick = () => startFlashcards(subject.id);
  document.getElementById('btn-home-results').onclick = () => { renderHome(); showScreen('screen-home'); };
  document.getElementById('progress-bar').style.width = '100%';
  showScreen('screen-results');
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

function startQuiz(subjectId, mode = 'quiz') {
  const subject = db.subjects.find(s => s.id === subjectId);
  let questions = subject.questions;

  if (mode === 'typing') {
    questions = questions.filter(q => q.type === 'open');
  }

  quiz = {
    subject,
    mode,
    questions: shuffle(questions),
    index: 0,
    score: 0,
    answered: false,
    selectedValue: null,
  };

  document.getElementById('quiz-subject-title').textContent = `${subject.emoji} ${subject.name}`;
  showScreen('screen-quiz');
  renderQuestion();
}

function renderQuestion() {
  const { questions, index, score } = quiz;
  const q = questions[index];

  document.getElementById('quiz-progress').textContent = `Vraag ${index + 1} van ${questions.length}`;
  document.getElementById('score-display').textContent = `${score}/${index}`;
  document.getElementById('progress-bar').style.width = `${(index / questions.length) * 100}%`;

  const area = document.getElementById('question-area');
  area.innerHTML = `<div class="question-text">${q.question}</div>` + buildQuestionHTML(q);

  const fb = document.getElementById('feedback-area');
  fb.className = 'feedback-area hidden';
  fb.textContent = '';

  document.getElementById('btn-check').classList.remove('hidden');
  document.getElementById('btn-next').classList.add('hidden');

  quiz.answered = false;
  quiz.selectedValue = null;
  attachQuestionListeners(q);
}

function buildQuestionHTML(q) {
  if (q.type === 'mc') {
    const labels = ['A', 'B', 'C', 'D'];
    return `<div class="mc-options">${q.options.map((opt, i) =>
      `<div class="mc-option" data-index="${i}">
        <span class="label">${labels[i]}</span><span>${opt}</span>
      </div>`).join('')}</div>`;
  }
  if (q.type === 'open') {
    return `<input type="text" class="open-input" id="open-answer" placeholder="Jouw antwoord..." autocomplete="off" spellcheck="false">`;
  }
  if (q.type === 'truefalse') {
    return `<div class="tf-options">
      <div class="tf-option" data-value="true">✅ Waar</div>
      <div class="tf-option" data-value="false">❌ Niet waar</div>
    </div>`;
  }
  return '';
}

function attachQuestionListeners(q) {
  if (q.type === 'mc') {
    document.querySelectorAll('.mc-option').forEach(el => {
      el.addEventListener('click', () => {
        if (quiz.answered) return;
        document.querySelectorAll('.mc-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        quiz.selectedValue = parseInt(el.dataset.index, 10);
      });
    });
  }
  if (q.type === 'open') {
    const input = document.getElementById('open-answer');
    input.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('btn-check').click(); });
    input.focus();
  }
  if (q.type === 'truefalse') {
    document.querySelectorAll('.tf-option').forEach(el => {
      el.addEventListener('click', () => {
        if (quiz.answered) return;
        document.querySelectorAll('.tf-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        quiz.selectedValue = el.dataset.value === 'true';
      });
    });
  }
}

function checkAnswer() {
  if (quiz.answered) return;
  const q = quiz.questions[quiz.index];
  let correct = false;
  let feedbackText = '';

  if (q.type === 'mc') {
    if (quiz.selectedValue === null) { alert('Kies een antwoord.'); return; }
    correct = quiz.selectedValue === q.correct;
    document.querySelectorAll('.mc-option').forEach((el, i) => {
      if (i === q.correct) el.classList.add('correct');
      else if (i === quiz.selectedValue) el.classList.add('wrong');
    });
    feedbackText = correct ? '✅ Correct!' : `❌ Fout. Juist antwoord: ${q.options[q.correct]}`;
  }

  if (q.type === 'open') {
    const input = document.getElementById('open-answer');
    const userVal = normalize(input.value);
    if (!userVal) { alert('Vul een antwoord in.'); return; }
    const allCorrect = [normalize(q.answer), ...(q.altAnswers || []).map(normalize)];
    correct = allCorrect.includes(userVal);
    input.classList.add(correct ? 'correct' : 'wrong');
    input.readOnly = true;
    feedbackText = correct ? '✅ Correct!' : `❌ Fout. Juist antwoord: ${q.answer}`;
  }

  if (q.type === 'truefalse') {
    if (quiz.selectedValue === null) { alert('Kies waar of niet waar.'); return; }
    correct = quiz.selectedValue === q.correct;
    document.querySelectorAll('.tf-option').forEach(el => {
      const val = el.dataset.value === 'true';
      if (val === q.correct) el.classList.add('correct');
      else if (val === quiz.selectedValue) el.classList.add('wrong');
    });
    feedbackText = correct ? '✅ Correct!' : `❌ Fout. Juist antwoord: ${q.correct ? 'Waar' : 'Niet waar'}`;
  }

  if (correct) quiz.score++;
  quiz.answered = true;

  recordStat(quiz.subject.id, q.id, correct);

  const fb = document.getElementById('feedback-area');
  fb.className = `feedback-area ${correct ? 'feedback-correct' : 'feedback-wrong'}`;
  fb.textContent = feedbackText;

  document.getElementById('btn-check').classList.add('hidden');
  document.getElementById('btn-next').classList.remove('hidden');
  document.getElementById('score-display').textContent = `${quiz.score}/${quiz.index + 1}`;
}

function nextQuestion() {
  quiz.index++;
  if (quiz.index >= quiz.questions.length) showQuizResults();
  else renderQuestion();
}

function showQuizResults() {
  const { score, questions, subject, mode } = quiz;
  const total = questions.length;
  const pct = Math.round((score / total) * 100);
  document.getElementById('results-title').textContent = mode === 'typing' ? 'Typen klaar!' : 'Quiz klaar!';
  document.getElementById('results-emoji').textContent = pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '👍' : '😞';
  document.getElementById('results-score').textContent = `${pct}%`;
  document.getElementById('results-breakdown').textContent = `${score} van de ${total} vragen goed`;
  document.getElementById('btn-retry').onclick = () => startQuiz(subject.id, mode);
  document.getElementById('btn-home-results').onclick = () => { renderHome(); showScreen('screen-home'); };
  document.getElementById('progress-bar').style.width = '100%';
  showScreen('screen-results');
  renderHome(); // update progress on cards in background
}

// ── Manage ────────────────────────────────────────────────────────────────────

function renderManage() {
  const select = document.getElementById('q-subject');
  select.innerHTML = db.subjects.map(s => `<option value="${s.id}">${s.emoji} ${s.name}</option>`).join('');

  const list = document.getElementById('manage-subjects-list');
  list.innerHTML = '';

  db.subjects.forEach(subject => {
    const card = document.createElement('div');
    card.className = 'subject-manage-card';
    card.innerHTML = `
      <div class="subject-manage-header">
        <h4>${subject.emoji} ${subject.name} <small style="color:var(--text-muted)">(${subject.questions.length})</small></h4>
        <button class="btn-delete" data-id="${subject.id}" title="Verwijder vak">🗑️</button>
      </div>
      <div class="question-list">
        ${subject.questions.map(q => `
          <div class="question-item">
            <span style="flex:1;margin-right:8px">${q.question}</span>
            <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
              <span class="q-type-badge">${{mc:'MC',open:'Open',truefalse:'W/NW'}[q.type]}</span>
              <button class="btn-delete" data-subject="${subject.id}" data-qid="${q.id}" title="Verwijder vraag">✕</button>
            </div>
          </div>`).join('') || '<p style="padding:8px;color:var(--text-muted);font-size:.85rem">Geen vragen</p>'}
      </div>`;
    list.appendChild(card);
  });

  list.querySelectorAll('.btn-delete[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm(`Vak verwijderen?`)) {
        db.subjects = db.subjects.filter(s => s.id !== btn.dataset.id);
        delete db.stats[btn.dataset.id];
        saveData(); renderManage(); renderHome();
      }
    });
  });

  list.querySelectorAll('.btn-delete[data-qid]').forEach(btn => {
    btn.addEventListener('click', () => {
      const subject = db.subjects.find(s => s.id === btn.dataset.subject);
      if (subject) {
        subject.questions = subject.questions.filter(q => q.id !== btn.dataset.qid);
        saveData(); renderManage(); renderHome();
      }
    });
  });
}

function addSubject() {
  const name = document.getElementById('new-subject-name').value.trim();
  const emoji = document.getElementById('new-subject-emoji').value.trim() || '📖';
  if (!name) { alert('Voer een vaknaam in.'); return; }
  const id = name.toLowerCase().replace(/\s+/g, '_') + '_' + uid();
  db.subjects.push({ id, name, emoji, questions: [] });
  saveData();
  document.getElementById('new-subject-name').value = '';
  document.getElementById('new-subject-emoji').value = '';
  renderManage(); renderHome();
}

function addQuestion() {
  const subjectId = document.getElementById('q-subject').value;
  const type = document.getElementById('q-type').value;
  const question = document.getElementById('q-question').value.trim();
  if (!question) { alert('Voer een vraag in.'); return; }

  const subject = db.subjects.find(s => s.id === subjectId);
  const q = { id: uid(), type, question };

  if (type === 'mc') {
    const opts = ['q-opt-a','q-opt-b','q-opt-c','q-opt-d'].map(id => document.getElementById(id).value.trim());
    if (opts.some(o => !o)) { alert('Vul alle vier opties in.'); return; }
    q.options = opts;
    q.correct = parseInt(document.getElementById('q-correct').value, 10);
  }
  if (type === 'open') {
    const answer = document.getElementById('q-answer').value.trim();
    if (!answer) { alert('Voer het correcte antwoord in.'); return; }
    q.answer = answer;
    q.altAnswers = document.getElementById('q-alt-answers').value.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (type === 'truefalse') {
    q.correct = document.getElementById('q-tf-answer').value === 'true';
  }

  subject.questions.push(q);
  saveData();
  ['q-question','q-opt-a','q-opt-b','q-opt-c','q-opt-d','q-answer','q-alt-answers'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  renderManage(); renderHome();
  alert('Vraag toegevoegd!');
}

function exportData() {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'schooltoets_vragen.json'; a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported.subjects || !Array.isArray(imported.subjects)) throw new Error();
      if (confirm('Huidige vragen vervangen met geïmporteerde vragen?')) {
        db = { ...imported, stats: imported.stats || db.stats || {} };
        saveData(); renderManage(); renderHome();
        alert('Vragen geïmporteerd!');
      }
    } catch (_) { alert('Ongeldig JSON-bestand.'); }
  };
  reader.readAsText(file);
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  syncBuiltinSubjects();
  renderHome();

  // Home
  document.getElementById('btn-manage').addEventListener('click', () => { renderManage(); showScreen('screen-manage'); });

  // Mode select
  document.getElementById('btn-back-mode').addEventListener('click', () => showScreen('screen-home'));
  document.getElementById('btn-mode-flashcard').addEventListener('click', () => startFlashcards(activeSubjectId));
  document.getElementById('btn-mode-typing').addEventListener('click', () => startQuiz(activeSubjectId, 'typing'));
  document.getElementById('btn-mode-quiz').addEventListener('click', () => startQuiz(activeSubjectId, 'quiz'));

  // Flashcard
  document.getElementById('btn-back-flashcard').addEventListener('click', () => {
    if (confirm('Flashcard-sessie stoppen?')) { renderHome(); showScreen('screen-mode'); openModeSelect(flashcard?.subject?.id || activeSubjectId); }
  });
  document.getElementById('flashcard').addEventListener('click', flipFlashcard);
  document.getElementById('flashcard').addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') flipFlashcard(); });
  document.getElementById('btn-fc-wrong').addEventListener('click', () => markFlashcard(false));
  document.getElementById('btn-fc-correct').addEventListener('click', () => markFlashcard(true));

  // Quiz
  document.getElementById('btn-back-quiz').addEventListener('click', () => {
    if (confirm('Quiz stoppen?')) { renderHome(); showScreen('screen-mode'); openModeSelect(quiz?.subject?.id || activeSubjectId); }
  });
  document.getElementById('btn-check').addEventListener('click', checkAnswer);
  document.getElementById('btn-next').addEventListener('click', nextQuestion);

  // Manage
  document.getElementById('btn-back-manage').addEventListener('click', () => showScreen('screen-home'));
  document.getElementById('btn-add-subject').addEventListener('click', addSubject);
  document.getElementById('btn-add-question').addEventListener('click', addQuestion);
  document.getElementById('btn-export').addEventListener('click', exportData);
  document.getElementById('file-import').addEventListener('change', e => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; });
  document.getElementById('btn-reset-stats').addEventListener('click', () => {
    if (confirm('Alle voortgang wissen?')) { db.stats = {}; saveData(); renderHome(); alert('Voortgang gewist.'); }
  });

  // Question type toggle in manage
  document.getElementById('q-type').addEventListener('change', e => {
    const type = e.target.value;
    document.getElementById('mc-options').classList.toggle('hidden', type !== 'mc');
    document.getElementById('open-options').classList.toggle('hidden', type !== 'open');
    document.getElementById('tf-options').classList.toggle('hidden', type !== 'truefalse');
  });
});
