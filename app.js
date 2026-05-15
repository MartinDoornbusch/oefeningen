// ── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'schooltoets_data';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
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
      {
        id: 'geschiedenis', name: 'Geschiedenis', emoji: '📜',
        questions: [
          { id: 'g1', type: 'mc', question: 'In welk jaar begon de Eerste Wereldoorlog?', options: ['1912', '1914', '1916', '1918'], correct: 1 },
          { id: 'g2', type: 'truefalse', question: 'Napoleon Bonaparte was van Italiaanse afkomst.', correct: false },
          { id: 'g3', type: 'open', question: 'In welk jaar viel de Berlijnse Muur?', answer: '1989', altAnswers: [] },
          { id: 'g4', type: 'mc', question: 'Wie schilderde de Mona Lisa?', options: ['Michelangelo', 'Rafaël', 'Leonardo da Vinci', 'Botticelli'], correct: 2 },
          { id: 'g5', type: 'mc', question: 'Welk land lanceerde de eerste satelliet (Spoetnik)?', options: ['VS', 'Duitsland', 'USSR', 'China'], correct: 2 },
        ]
      },
      {
        id: 'biologie', name: 'Biologie', emoji: '🧬',
        questions: [
          { id: 'b1', type: 'mc', question: 'Wat is het grootste orgaan van het menselijk lichaam?', options: ['Lever', 'Longen', 'Huid', 'Hersenen'], correct: 2 },
          { id: 'b2', type: 'truefalse', question: 'Planten produceren zuurstof via fotosynthese.', correct: true },
          { id: 'b3', type: 'open', question: 'Hoeveel kamers heeft een menselijk hart?', answer: '4', altAnswers: ['vier'] },
          { id: 'b4', type: 'mc', question: 'Welk organisme maakt 70% van de aardse zuurstof aan?', options: ['Bomen', 'Algen', 'Grassen', 'Mossen'], correct: 1 },
          { id: 'b5', type: 'mc', question: 'Hoe heet de bouwsteen van leven?', options: ['Atoom', 'Molecuul', 'Cel', 'Weefsel'], correct: 2 },
        ]
      }
    ]
  };
}

// ── State ─────────────────────────────────────────────────────────────────────

let db = loadData();
let quiz = null; // active quiz session

// ── Utility ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(str) {
  return str.trim().toLowerCase().replace(/[.,!?;:]/g, '');
}

// ── Screens ───────────────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Home ──────────────────────────────────────────────────────────────────────

function renderHome() {
  const grid = document.getElementById('subject-grid');
  grid.innerHTML = '';

  if (db.subjects.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:32px">Geen vakken gevonden. Voeg een vak toe via "Vragen beheren".</p>';
    return;
  }

  db.subjects.forEach(subject => {
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.innerHTML = `
      <span class="emoji">${subject.emoji}</span>
      <div class="name">${subject.name}</div>
      <div class="count">${subject.questions.length} vragen</div>
    `;
    card.addEventListener('click', () => {
      if (subject.questions.length === 0) {
        alert('Dit vak heeft nog geen vragen. Voeg eerst vragen toe.');
        return;
      }
      startQuiz(subject.id);
    });
    grid.appendChild(card);
  });
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

function startQuiz(subjectId) {
  const subject = db.subjects.find(s => s.id === subjectId);
  const questions = shuffle(subject.questions);

  quiz = {
    subject,
    questions,
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

  const feedbackArea = document.getElementById('feedback-area');
  feedbackArea.className = 'feedback-area hidden';
  feedbackArea.textContent = '';

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
        <span class="label">${labels[i]}</span>
        <span>${opt}</span>
      </div>`
    ).join('')}</div>`;
  }

  if (q.type === 'open') {
    return `<input type="text" class="open-input" id="open-answer" placeholder="Jouw antwoord..." autocomplete="off">`;
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
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-check').click();
    });
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
    feedbackText = correct ? '✅ Correct!' : `❌ Fout. Het juiste antwoord was: ${q.options[q.correct]}`;
  }

  if (q.type === 'open') {
    const input = document.getElementById('open-answer');
    const userAnswer = normalize(input.value);
    if (!userAnswer) { alert('Vul een antwoord in.'); return; }
    const allCorrect = [normalize(q.answer), ...(q.altAnswers || []).map(normalize)];
    correct = allCorrect.includes(userAnswer);
    input.classList.add(correct ? 'correct' : 'wrong');
    input.readOnly = true;
    feedbackText = correct ? '✅ Correct!' : `❌ Fout. Het juiste antwoord was: ${q.answer}`;
  }

  if (q.type === 'truefalse') {
    if (quiz.selectedValue === null) { alert('Kies waar of niet waar.'); return; }
    correct = quiz.selectedValue === q.correct;
    document.querySelectorAll('.tf-option').forEach(el => {
      const val = el.dataset.value === 'true';
      if (val === q.correct) el.classList.add('correct');
      else if (val === quiz.selectedValue) el.classList.add('wrong');
    });
    feedbackText = correct ? '✅ Correct!' : `❌ Fout. Het juiste antwoord was: ${q.correct ? 'Waar' : 'Niet waar'}`;
  }

  if (correct) quiz.score++;
  quiz.answered = true;

  const feedbackArea = document.getElementById('feedback-area');
  feedbackArea.className = `feedback-area ${correct ? 'feedback-correct' : 'feedback-wrong'}`;
  feedbackArea.textContent = feedbackText;

  document.getElementById('btn-check').classList.add('hidden');
  document.getElementById('btn-next').classList.remove('hidden');
  document.getElementById('score-display').textContent = `${quiz.score}/${quiz.index + 1}`;
}

function nextQuestion() {
  quiz.index++;
  if (quiz.index >= quiz.questions.length) {
    showResults();
  } else {
    renderQuestion();
  }
}

function showResults() {
  const { score, questions } = quiz;
  const total = questions.length;
  const pct = Math.round((score / total) * 100);

  let emoji = '😞';
  if (pct >= 90) emoji = '🏆';
  else if (pct >= 70) emoji = '🎉';
  else if (pct >= 50) emoji = '👍';

  document.getElementById('results-emoji').textContent = emoji;
  document.getElementById('results-score').textContent = `${pct}%`;
  document.getElementById('results-breakdown').textContent = `${score} van de ${total} vragen goed`;
  showScreen('screen-results');
  document.getElementById('progress-bar').style.width = '100%';
}

// ── Manage ────────────────────────────────────────────────────────────────────

function renderManage() {
  // Populate subject dropdown
  const select = document.getElementById('q-subject');
  select.innerHTML = db.subjects.map(s => `<option value="${s.id}">${s.emoji} ${s.name}</option>`).join('');

  // Render subjects list
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
            <span>${q.question}</span>
            <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
              <span class="q-type-badge">${{mc:'MC', open:'Open', truefalse:'W/NW'}[q.type]}</span>
              <button class="btn-delete" data-subject="${subject.id}" data-qid="${q.id}" title="Verwijder vraag">✕</button>
            </div>
          </div>
        `).join('') || '<p style="padding:8px;color:var(--text-muted);font-size:.85rem">Geen vragen</p>'}
      </div>
    `;
    list.appendChild(card);
  });

  // Delete subject listeners
  list.querySelectorAll('.btn-delete[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm(`Wil je het vak "${btn.dataset.id}" verwijderen?`)) {
        db.subjects = db.subjects.filter(s => s.id !== btn.dataset.id);
        saveData();
        renderManage();
        renderHome();
      }
    });
  });

  // Delete question listeners
  list.querySelectorAll('.btn-delete[data-qid]').forEach(btn => {
    btn.addEventListener('click', () => {
      const subject = db.subjects.find(s => s.id === btn.dataset.subject);
      if (subject) {
        subject.questions = subject.questions.filter(q => q.id !== btn.dataset.qid);
        saveData();
        renderManage();
        renderHome();
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
  renderManage();
  renderHome();
}

function addQuestion() {
  const subjectId = document.getElementById('q-subject').value;
  const type = document.getElementById('q-type').value;
  const question = document.getElementById('q-question').value.trim();
  if (!question) { alert('Voer een vraag in.'); return; }

  const subject = db.subjects.find(s => s.id === subjectId);
  const q = { id: uid(), type, question };

  if (type === 'mc') {
    const opts = ['q-opt-a', 'q-opt-b', 'q-opt-c', 'q-opt-d'].map(id =>
      document.getElementById(id).value.trim()
    );
    if (opts.some(o => !o)) { alert('Vul alle vier opties in.'); return; }
    q.options = opts;
    q.correct = parseInt(document.getElementById('q-correct').value, 10);
  }

  if (type === 'open') {
    const answer = document.getElementById('q-answer').value.trim();
    if (!answer) { alert('Voer het correcte antwoord in.'); return; }
    q.answer = answer;
    q.altAnswers = document.getElementById('q-alt-answers').value
      .split(',').map(s => s.trim()).filter(Boolean);
  }

  if (type === 'truefalse') {
    q.correct = true; // default; user picks answer=true
    // For TF we repurpose the answer field
    const tfAnswer = document.getElementById('q-answer').value.trim().toLowerCase();
    q.correct = !['nee', 'false', 'niet waar', 'n', 'f', '0'].includes(tfAnswer);
  }

  subject.questions.push(q);
  saveData();

  // Clear fields
  ['q-question', 'q-opt-a', 'q-opt-b', 'q-opt-c', 'q-opt-d', 'q-answer', 'q-alt-answers']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

  renderManage();
  renderHome();
  alert('Vraag toegevoegd!');
}

function exportData() {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'schooltoets_vragen.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported.subjects || !Array.isArray(imported.subjects)) throw new Error();
      if (confirm('Wil je de huidige vragen vervangen met het geïmporteerde bestand?')) {
        db = imported;
        saveData();
        renderManage();
        renderHome();
        alert('Vragen geïmporteerd!');
      }
    } catch (_) {
      alert('Ongeldig JSON-bestand.');
    }
  };
  reader.readAsText(file);
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Home
  renderHome();
  document.getElementById('btn-manage').addEventListener('click', () => {
    renderManage();
    showScreen('screen-manage');
  });

  // Quiz
  document.getElementById('btn-back').addEventListener('click', () => {
    if (confirm('Weet je zeker dat je de toets wilt stoppen?')) showScreen('screen-home');
  });
  document.getElementById('btn-check').addEventListener('click', checkAnswer);
  document.getElementById('btn-next').addEventListener('click', nextQuestion);

  // Results
  document.getElementById('btn-retry').addEventListener('click', () => startQuiz(quiz.subject.id));
  document.getElementById('btn-home').addEventListener('click', () => showScreen('screen-home'));

  // Manage
  document.getElementById('btn-back-manage').addEventListener('click', () => showScreen('screen-home'));
  document.getElementById('btn-add-subject').addEventListener('click', addSubject);
  document.getElementById('btn-add-question').addEventListener('click', addQuestion);
  document.getElementById('btn-export').addEventListener('click', exportData);
  document.getElementById('file-import').addEventListener('change', e => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = '';
  });

  // Toggle question type form
  document.getElementById('q-type').addEventListener('change', e => {
    const type = e.target.value;
    document.getElementById('mc-options').classList.toggle('hidden', type !== 'mc');
    document.getElementById('open-options').classList.toggle('hidden', type === 'mc');
    if (type === 'truefalse') {
      document.getElementById('q-answer').placeholder = 'Antwoord: waar / niet waar';
    } else {
      document.getElementById('q-answer').placeholder = 'Correct antwoord';
    }
  });
});
