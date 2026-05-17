// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'schooltoets_v3';

function loadData() {
  try {
    // Try v3 format
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (!data.stats) data.stats = {};
      return data;
    }
    // Migrate from v2 (had top-level stats without profiles)
    const v2raw = localStorage.getItem('schooltoets_v2');
    if (v2raw) {
      const v2 = JSON.parse(v2raw);
      const data = {
        profiles: [],
        activeProfileId: null,
        subjects: v2.subjects || [],
        stats: {}
      };
      localStorage.removeItem('schooltoets_v2');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (_) {}
  return defaultData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function defaultSubjects() {
  return [
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
  ];
}

function defaultData() {
  return { profiles: [], activeProfileId: null, subjects: defaultSubjects(), stats: {} };
}

// ── State ─────────────────────────────────────────────────────────────────────

let db = loadData();
let activeSubjectId = null;
let quiz = null;
let flashcard = null;
let pinCallback = null;   // called after successful PIN entry
let pinBuffer = '';

// ── Profiles ──────────────────────────────────────────────────────────────────

function activeProfile() {
  return db.profiles.find(p => p.id === db.activeProfileId) || null;
}

function profileStats(profileId) {
  if (!db.stats[profileId]) db.stats[profileId] = {};
  return db.stats[profileId];
}

function hashPin(pin) {
  let h = 0;
  for (const c of pin) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return h.toString(16);
}

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

function normalizeBase(str) {
  return str.trim().replace(/['']/g, '').replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();
}
function normalizeStrict(str) {  // lowercase, keep accents
  return normalizeBase(str).toLowerCase();
}
function normalize(str) {  // lowercase, strip accents
  return normalizeStrict(str).normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function stripAccentsOnly(str) {  // keep case, strip accents
  return normalizeBase(str).normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function highlightAccents(str) {
  return str.replace(/[àáâãäåçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸ]/g,
    ch => `<mark class="accent-mark">${ch}</mark>`);
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function recordStat(subjectId, questionId, correct) {
  const pid = db.activeProfileId;
  if (!pid) return;
  if (!db.stats[pid]) db.stats[pid] = {};
  if (!db.stats[pid][subjectId]) db.stats[pid][subjectId] = {};
  if (!db.stats[pid][subjectId][questionId]) db.stats[pid][subjectId][questionId] = { attempts: 0, correct: 0 };
  db.stats[pid][subjectId][questionId].attempts++;
  if (correct) db.stats[pid][subjectId][questionId].correct++;
  saveData();
}

function masteryPct(subjectId, profileId) {
  const pid = profileId || db.activeProfileId;
  const subject = db.subjects.find(s => s.id === subjectId);
  if (!subject || subject.questions.length === 0) return 0;
  const subStats = db.stats[pid]?.[subjectId] || {};
  const mastered = subject.questions.filter(q => subStats[q.id]?.correct > 0).length;
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

// ── PIN modal ─────────────────────────────────────────────────────────────────

function showPin(profile, onSuccess) {
  pinBuffer = '';
  pinCallback = onSuccess;
  document.getElementById('pin-profile-emoji').textContent = profile.emoji;
  document.getElementById('pin-title').textContent = `Pincode voor ${profile.name}`;
  document.getElementById('pin-error').classList.add('hidden');
  updatePinDots();
  document.getElementById('pin-overlay').classList.remove('hidden');
}

function updatePinDots() {
  document.querySelectorAll('.pin-dot').forEach((dot, i) => {
    dot.classList.toggle('filled', i < pinBuffer.length);
  });
}

function pinKeyPress(val) {
  if (pinBuffer.length >= 4) return;
  pinBuffer += val;
  updatePinDots();
  if (pinBuffer.length === 4) {
    const profile = db.profiles.find(p => p.id === db.activeProfileId ||
      (pinCallback && db.profiles.find(pr => pr.isParent && pr.pinHash)));
    // Find which parent profile we're verifying
    const parentProfile = db.profiles.find(p => p.isParent && p.pinHash);
    const target = db._pendingPinProfile ? db.profiles.find(p => p.id === db._pendingPinProfile) : parentProfile;
    if (target && hashPin(pinBuffer) === target.pinHash) {
      document.getElementById('pin-overlay').classList.add('hidden');
      document.getElementById('pin-error').classList.add('hidden');
      pinBuffer = '';
      if (pinCallback) { const cb = pinCallback; pinCallback = null; cb(); }
    } else {
      document.getElementById('pin-error').classList.remove('hidden');
      pinBuffer = '';
      updatePinDots();
    }
  }
}

// ── Profile screens ───────────────────────────────────────────────────────────

function renderProfileScreen() {
  const grid = document.getElementById('profile-grid');
  grid.innerHTML = '';

  if (db.profiles.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:24px 0">Nog geen profielen. Maak er een aan.</p>';
    return;
  }

  db.profiles.forEach(profile => {
    const card = document.createElement('div');
    card.className = 'profile-card' + (profile.isParent ? ' parent-card' : '');
    card.innerHTML = `
      <span class="p-emoji">${profile.emoji}</span>
      <div class="p-name">${profile.name}</div>
      ${profile.isParent ? '<span class="p-badge">🔒 Ouder</span>' : ''}`;
    card.addEventListener('click', () => selectProfile(profile));
    grid.appendChild(card);
  });
}

function selectProfile(profile) {
  if (profile.isParent && profile.pinHash) {
    db._pendingPinProfile = profile.id;
    showPin(profile, () => {
      db.activeProfileId = profile.id;
      delete db._pendingPinProfile;
      saveData();
      enterHome();
    });
  } else {
    db.activeProfileId = profile.id;
    saveData();
    enterHome();
  }
}

function enterHome() {
  const profile = activeProfile();
  const badge = document.getElementById('home-profile-badge');
  badge.textContent = profile ? `${profile.emoji} ${profile.name}` : '';

  const parentBtn = document.getElementById('btn-parent-dashboard');
  const manageBtn = document.getElementById('btn-manage');
  if (profile?.isParent) {
    parentBtn.classList.remove('hidden');
    manageBtn.classList.remove('hidden');
  } else {
    parentBtn.classList.add('hidden');
    manageBtn.classList.add('hidden');
  }

  syncBuiltinSubjects().then(() => renderHome());
  showScreen('screen-home');
}

// ── Sync built-in subjects ────────────────────────────────────────────────────

async function syncBuiltinSubjects() {
  try {
    const res = await fetch('data/subjects.json');
    if (!res.ok) return;
    const { subjects } = await res.json();
    let changed = false;
    subjects.forEach(builtinSubject => {
      const existing = db.subjects.find(s => s.id === builtinSubject.id);
      if (!existing) {
        db.subjects.unshift(builtinSubject);
        changed = true;
      } else {
        const existingQIds = new Set(existing.questions.map(q => q.id));
        const newQs = builtinSubject.questions.filter(q => !existingQIds.has(q.id));
        if (newQs.length > 0) { existing.questions.push(...newQs); changed = true; }
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
    grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:32px 0">Geen vakken. Voeg er een toe.</p>';
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
      if (activeProfile()?.isParent) {
        openSubjectView(subject.id);
      } else {
        openModeSelect(subject.id);
      }
    });
    grid.appendChild(card);
  });
}

// ── Subject view (parent read-only) ──────────────────────────────────────────

function openSubjectView(subjectId) {
  const subject = db.subjects.find(s => s.id === subjectId);
  document.getElementById('subject-view-heading').textContent = `${subject.emoji} ${subject.name}`;
  const content = document.getElementById('subject-view-content');

  const groups = [
    { label: '📝 Open / Woordjes', types: ['open'] },
    { label: '🔵 Meerkeuze',       types: ['mc'] },
    { label: '✅ Waar / Niet waar', types: ['truefalse'] },
  ];

  content.innerHTML = groups.map(g => {
    const qs = subject.questions.filter(q => g.types.includes(q.type));
    if (qs.length === 0) return '';
    const items = qs.map((q, i) => {
      let answerHtml;
      if (q.type === 'open') {
        answerHtml = `<span class="sv-answer">${q.answer}</span>`;
      } else if (q.type === 'mc') {
        answerHtml = q.options.map((opt, j) =>
          `<span class="${j === q.correct ? 'sv-answer' : 'sv-option'}">${['A','B','C','D'][j]}. ${opt}</span>`
        ).join('');
      } else {
        answerHtml = `<span class="sv-answer">${q.correct ? 'Waar' : 'Niet waar'}</span>`;
      }
      return `<div class="sv-item">
        <span class="sv-num">${i + 1}</span>
        <div class="sv-body">
          <div class="sv-q">${q.question}</div>
          <div class="sv-a">${answerHtml}</div>
        </div>
      </div>`;
    }).join('');
    return `<div class="sv-group">
      <h4 class="sv-group-title">${g.label} <span class="sv-count">${qs.length}</span></h4>
      ${items}
    </div>`;
  }).join('');

  showScreen('screen-subject-view');
}

// ── Parent dashboard ──────────────────────────────────────────────────────────

function renderParentDashboard() {
  const content = document.getElementById('parent-content');
  const children = db.profiles.filter(p => !p.isParent);

  if (children.length === 0) {
    content.innerHTML = '<div class="parent-no-data">Nog geen kindprofielen aangemaakt.</div>';
    return;
  }

  content.innerHTML = '';
  children.forEach(child => {
    const childStats = db.stats[child.id] || {};
    const totalAttempts = Object.values(childStats).reduce((sum, sq) =>
      sum + Object.values(sq).reduce((s, q) => s + q.attempts, 0), 0);
    const totalCorrect = Object.values(childStats).reduce((sum, sq) =>
      sum + Object.values(sq).reduce((s, q) => s + q.correct, 0), 0);

    const card = document.createElement('div');
    card.className = 'parent-child-card';

    const subjectRows = db.subjects.map(subject => {
      const pct = masteryPct(subject.id, child.id);
      const color = masteryColor(pct);
      const subStats = childStats[subject.id] || {};
      const attempted = Object.values(subStats).filter(q => q.attempts > 0).length;
      const correct   = Object.values(subStats).reduce((s, q) => s + q.correct, 0);
      const attempts  = Object.values(subStats).reduce((s, q) => s + q.attempts, 0);

      // Find hardest questions (lowest correct/attempts ratio, at least 1 attempt)
      const hardQs = subject.questions
        .filter(q => subStats[q.id]?.attempts > 0)
        .map(q => ({ q, ratio: subStats[q.id].correct / subStats[q.id].attempts, stat: subStats[q.id] }))
        .sort((a, b) => a.ratio - b.ratio)
        .slice(0, 5);

      const typeGroups = [
        { label: 'Woordjes',       types: ['open'] },
        { label: 'Meerkeuze',      types: ['mc'] },
        { label: 'Waar/niet waar', types: ['truefalse'] },
      ];
      const typeBreakdown = typeGroups.map(g => {
        const qs = subject.questions.filter(q => g.types.includes(q.type));
        if (qs.length === 0) return '';
        const att = qs.filter(q => subStats[q.id]?.attempts > 0).length;
        const cor = qs.reduce((s, q) => s + (subStats[q.id]?.correct || 0), 0);
        const tot = qs.reduce((s, q) => s + (subStats[q.id]?.attempts || 0), 0);
        const tpct = tot > 0 ? Math.round(cor / tot * 100) : null;
        return `<div class="type-row">
          <span class="type-label">${g.label}</span>
          <span class="type-stat">${att}/${qs.length}</span>
          <div class="type-bar-bg"><div class="type-bar-fill" style="width:${tpct||0}%;background:${masteryColor(tpct||0)}"></div></div>
          <span class="type-pct" style="color:${tpct!==null?masteryColor(tpct):'var(--text-muted)'}">${tpct !== null ? tpct + '%' : '—'}</span>
        </div>`;
      }).filter(Boolean).join('');

      const hardHtml = hardQs.length > 0
        ? `<div class="hard-title">Moeilijkste vragen:</div>
           <div class="hard-questions">${hardQs.map(({ q, stat }) =>
             `<div class="hard-q-item">
               <span class="hard-q-text">${q.question.length > 60 ? q.question.slice(0, 60) + '…' : q.question}</span>
               <span class="hard-q-score">${stat.correct}/${stat.attempts}</span>
             </div>`).join('')}</div>`
        : '<div style="color:var(--text-muted);font-size:.82rem">Nog niet geoefend.</div>';

      return `
        <div class="parent-subject-row" onclick="toggleSubjectDetail(this)">
          <span class="ps-emoji">${subject.emoji}</span>
          <span class="ps-name">${subject.name}</span>
          <div class="parent-subject-bar-bg">
            <div class="parent-subject-bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <span class="ps-pct" style="color:${pct>0?color:'var(--text-muted)'}">${pct > 0 ? pct + '%' : '—'}</span>
        </div>
        <div class="parent-subject-detail">
          <div class="type-breakdown">${typeBreakdown}</div>
          ${hardHtml}
        </div>`;
    }).join('');

    card.innerHTML = `
      <div class="parent-child-header">
        <span class="p-emoji">${child.emoji}</span>
        <div class="p-info">
          <h3>${child.name}</h3>
          <small>${totalAttempts} pogingen • ${totalCorrect} goed (${totalAttempts > 0 ? Math.round(totalCorrect/totalAttempts*100) : 0}%)</small>
        </div>
      </div>
      <div class="parent-subject-list">${subjectRows}</div>`;
    content.appendChild(card);
  });
}

function toggleSubjectDetail(row) {
  const detail = row.nextElementSibling;
  detail.classList.toggle('open');
}

// ── Mode select ───────────────────────────────────────────────────────────────

function openModeSelect(subjectId) {
  activeSubjectId = subjectId;
  const subject = db.subjects.find(s => s.id === subjectId);
  document.getElementById('mode-subject-heading').textContent = `${subject.emoji} ${subject.name}`;

  const pid = db.activeProfileId;
  const subStats = db.stats[pid]?.[subjectId] || {};
  const total    = subject.questions.length;
  const attempted = subject.questions.filter(q => subStats[q.id]?.attempts > 0).length;
  const mastered  = subject.questions.filter(q => subStats[q.id]?.correct  > 0).length;
  const openQs    = subject.questions.filter(q => q.type === 'open').length;
  const pct = masteryPct(subjectId);

  document.getElementById('mode-progress-overview').innerHTML = `
    <h4>📊 Voortgang van ${activeProfile()?.name || 'jou'}</h4>
    <div class="mprog-row">
      <span class="mprog-label">Beheerst</span>
      <div class="mprog-bar-bg"><div class="mprog-bar-fill" style="width:${pct}%;background:${masteryColor(pct)}"></div></div>
      <span class="mprog-pct" style="color:${masteryColor(pct)}">${pct}%</span>
    </div>
    <div style="font-size:.82rem;color:var(--text-muted);margin-top:4px">
      ${mastered} / ${total} minstens één keer goed • ${attempted} geprobeerd${openQs > 0 ? ` • ${openQs} typvragen` : ''}
    </div>`;

  const typingBtn = document.getElementById('btn-mode-typing');
  typingBtn.disabled = openQs === 0;
  typingBtn.querySelector('.mode-desc').textContent = openQs === 0
    ? 'Geen typvragen in dit vak' : 'Antwoorden invullen';

  showScreen('screen-mode');
}

// ── Flashcards ────────────────────────────────────────────────────────────────

function startFlashcards(subjectId) {
  const subject = db.subjects.find(s => s.id === subjectId);
  flashcard = { subject, deck: shuffle(subject.questions), index: 0, known: 0, flipped: false };
  document.getElementById('fc-subject-title').textContent = `${subject.emoji} ${subject.name}`;
  showScreen('screen-flashcard');
  renderFlashcard();
}

function renderFlashcard() {
  const { deck, index, known } = flashcard;
  const q = deck[index];
  document.getElementById('fc-progress').textContent = `Kaart ${index + 1} van ${deck.length}`;
  document.getElementById('fc-known-count').textContent = `✅ ${known}`;
  document.getElementById('fc-progress-bar').style.width = `${(index / deck.length) * 100}%`;
  document.getElementById('fc-front').innerHTML = `<div class="fc-label">Vraag</div><div class="fc-content">${q.question}</div>`;
  document.getElementById('fc-back').innerHTML  = `<div class="fc-label">Antwoord</div><div class="fc-content">${getAnswerDisplay(q)}</div>`;
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
  recordStat(subject.id, deck[index].id, known);
  if (known) flashcard.known++;
  flashcard.index++;
  if (flashcard.index >= flashcard.deck.length) showFlashcardResults();
  else renderFlashcard();
}

function showFlashcardResults() {
  const { known, deck, subject } = flashcard;
  const pct = Math.round((known / deck.length) * 100);
  document.getElementById('results-title').textContent = 'Flashcards klaar!';
  document.getElementById('results-emoji').textContent = pct >= 80 ? '🏆' : pct >= 50 ? '🎉' : '💪';
  document.getElementById('results-score').textContent = `${pct}%`;
  document.getElementById('results-breakdown').textContent = `${known} van de ${deck.length} kaarten gekend`;
  document.getElementById('btn-retry').onclick = () => startFlashcards(subject.id);
  document.getElementById('btn-home-results').onclick = () => { renderHome(); showScreen('screen-home'); };
  showScreen('screen-results');
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

function startQuiz(subjectId, mode = 'quiz') {
  const subject = db.subjects.find(s => s.id === subjectId);
  let questions = mode === 'typing'
    ? subject.questions.filter(q => q.type === 'open')
    : subject.questions;

  quiz = { subject, mode, questions: shuffle(questions), index: 0, score: 0, answered: false, selectedValue: null, retrying: false };
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
  fb.className = 'feedback-area hidden'; fb.innerHTML = '';
  document.getElementById('btn-check').classList.remove('hidden');
  document.getElementById('btn-next').classList.add('hidden');
  document.getElementById('btn-retry-answer').classList.add('hidden');
  quiz.answered = false; quiz.selectedValue = null; quiz.retrying = false;
  attachQuestionListeners(q);
}

function buildQuestionHTML(q) {
  if (q.type === 'mc') {
    const labels = ['A', 'B', 'C', 'D'];
    return `<div class="mc-options">${q.options.map((opt, i) =>
      `<div class="mc-option" data-index="${i}"><span class="label">${labels[i]}</span><span>${opt}</span></div>`
    ).join('')}</div>`;
  }
  if (q.type === 'open') {
    return `<input type="text" class="open-input" id="open-answer" placeholder="Jouw antwoord..." autocomplete="off" spellcheck="false">`;
  }
  if (q.type === 'truefalse') {
    return `<div class="tf-options"><div class="tf-option" data-value="true">✅ Waar</div><div class="tf-option" data-value="false">❌ Niet waar</div></div>`;
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
  let feedbackHtml = '';
  let feedbackClass = 'feedback-wrong';

  if (q.type === 'mc') {
    if (quiz.selectedValue === null) { alert('Kies een antwoord.'); return; }
    correct = quiz.selectedValue === q.correct;
    document.querySelectorAll('.mc-option').forEach((el, i) => {
      if (i === q.correct) el.classList.add('correct');
      else if (i === quiz.selectedValue) el.classList.add('wrong');
    });
    feedbackHtml = correct ? '✅ Correct!' : `❌ Fout. Juist: <strong>${q.options[q.correct]}</strong>`;
    feedbackClass = correct ? 'feedback-correct' : 'feedback-wrong';
  }
  if (q.type === 'open') {
    const input = document.getElementById('open-answer');
    const userRaw = input.value;
    if (!normalizeBase(userRaw)) { alert('Vul een antwoord in.'); return; }
    const allAnswers = [q.answer, ...(q.altAnswers || [])];
    // Primary answer: strict checks (case + accent matter)
    const primaryExact  = normalizeBase(userRaw) === normalizeBase(q.answer);
    const primaryCase   = !primaryExact && normalizeStrict(userRaw) === normalizeStrict(q.answer);
    const primaryAccent = !primaryExact && !primaryCase && normalize(userRaw) === normalize(q.answer);
    // altAnswers: always fully accepted via lax match (no case/accent requirement)
    const altAccepted   = !primaryExact && (q.altAnswers || []).some(a => normalize(userRaw) === normalize(a));
    correct = primaryExact || altAccepted;
    if (correct) {
      input.classList.add('correct');
      feedbackHtml = '✅ Correct!';
      feedbackClass = 'feedback-correct';
    } else if (primaryCase) {
      input.classList.add('accent-warn');
      feedbackHtml = `⚠️ Bijna goed! Let op de hoofdletters.<br>Juist: <strong>${q.answer}</strong>`;
      feedbackClass = 'feedback-accent';
      if (!quiz.retrying) document.getElementById('btn-retry-answer').classList.remove('hidden');
    } else if (primaryAccent) {
      input.classList.add('accent-warn');
      const caseAlsoWrong = stripAccentsOnly(userRaw) !== stripAccentsOnly(q.answer);
      const issue = caseAlsoWrong ? 'de accenten en de hoofdletters' : 'de accenten';
      feedbackHtml = `⚠️ Bijna goed! Let op ${issue}.<br>Juist: <strong>${highlightAccents(q.answer)}</strong>`;
      feedbackClass = 'feedback-accent';
      if (!quiz.retrying) document.getElementById('btn-retry-answer').classList.remove('hidden');
    } else {
      input.classList.add('wrong');
      feedbackHtml = `❌ Fout. Juist: <strong>${q.answer}</strong>`;
      feedbackClass = 'feedback-wrong';
    }
    input.readOnly = true;
  }
  if (q.type === 'truefalse') {
    if (quiz.selectedValue === null) { alert('Kies waar of niet waar.'); return; }
    correct = quiz.selectedValue === q.correct;
    document.querySelectorAll('.tf-option').forEach(el => {
      const val = el.dataset.value === 'true';
      if (val === q.correct) el.classList.add('correct');
      else if (val === quiz.selectedValue) el.classList.add('wrong');
    });
    feedbackHtml = correct ? '✅ Correct!' : `❌ Fout. Juist: <strong>${q.correct ? 'Waar' : 'Niet waar'}</strong>`;
    feedbackClass = correct ? 'feedback-correct' : 'feedback-wrong';
  }

  if (correct) quiz.score++;
  quiz.answered = true;
  recordStat(quiz.subject.id, q.id, correct);

  const fb = document.getElementById('feedback-area');
  fb.className = `feedback-area ${feedbackClass}`;
  fb.innerHTML = feedbackHtml;
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
  const pct = Math.round((score / questions.length) * 100);
  document.getElementById('results-title').textContent = mode === 'typing' ? 'Typen klaar!' : 'Quiz klaar!';
  document.getElementById('results-emoji').textContent = pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '👍' : '😞';
  document.getElementById('results-score').textContent = `${pct}%`;
  document.getElementById('results-breakdown').textContent = `${score} van de ${questions.length} vragen goed`;
  document.getElementById('btn-retry').onclick = () => startQuiz(subject.id, mode);
  document.getElementById('btn-home-results').onclick = () => { renderHome(); showScreen('screen-home'); };
  showScreen('screen-results');
  renderHome();
}

// ── Manage ────────────────────────────────────────────────────────────────────

function renderManage() {
  if (!activeProfile()?.isParent) { showScreen('screen-home'); return; }
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
        <button class="btn-delete" data-id="${subject.id}">🗑️</button>
      </div>
      <div class="question-list">
        ${subject.questions.map(q => `
          <div class="question-item">
            <span style="flex:1;margin-right:8px">${q.question}</span>
            <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
              <span class="q-type-badge">${{mc:'MC',open:'Open',truefalse:'W/NW'}[q.type]}</span>
              <button class="btn-delete" data-subject="${subject.id}" data-qid="${q.id}">✕</button>
            </div>
          </div>`).join('') || '<p style="padding:8px;color:var(--text-muted);font-size:.85rem">Geen vragen</p>'}
      </div>`;
    list.appendChild(card);
  });

  list.querySelectorAll('.btn-delete[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Vak verwijderen?')) {
        db.subjects = db.subjects.filter(s => s.id !== btn.dataset.id);
        saveData(); renderManage(); renderHome();
      }
    });
  });
  list.querySelectorAll('.btn-delete[data-qid]').forEach(btn => {
    btn.addEventListener('click', () => {
      const subject = db.subjects.find(s => s.id === btn.dataset.subject);
      if (subject) { subject.questions = subject.questions.filter(q => q.id !== btn.dataset.qid); saveData(); renderManage(); renderHome(); }
    });
  });
}

function addSubject() {
  const name = document.getElementById('new-subject-name').value.trim();
  const emoji = document.getElementById('new-subject-emoji').value.trim() || '📖';
  if (!name) { alert('Voer een vaknaam in.'); return; }
  db.subjects.push({ id: name.toLowerCase().replace(/\s+/g, '_') + '_' + uid(), name, emoji, questions: [] });
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
    q.options = opts; q.correct = parseInt(document.getElementById('q-correct').value, 10);
  }
  if (type === 'open') {
    const answer = document.getElementById('q-answer').value.trim();
    if (!answer) { alert('Voer het correcte antwoord in.'); return; }
    q.answer = answer;
    q.altAnswers = document.getElementById('q-alt-answers').value.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (type === 'truefalse') { q.correct = document.getElementById('q-tf-answer').value === 'true'; }
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
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'schooltoets.json' });
  a.click(); URL.revokeObjectURL(a.href);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported.subjects) throw new Error();
      if (confirm('Huidige data vervangen?')) { db = { ...imported, stats: imported.stats || {} }; saveData(); renderManage(); renderHome(); alert('Geïmporteerd!'); }
    } catch (_) { alert('Ongeldig bestand.'); }
  };
  reader.readAsText(file);
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Start at profile screen (or home if profile already active)
  if (db.activeProfileId && db.profiles.find(p => p.id === db.activeProfileId)) {
    enterHome();
  } else {
    renderProfileScreen();
    showScreen('screen-profiles');
  }

  // Profile screen
  document.getElementById('btn-add-profile').addEventListener('click', () => {
    const parentExists = db.profiles.some(p => p.isParent);
    const parentRow = document.getElementById('new-profile-is-parent').closest('label');
    parentRow.style.display = parentExists ? 'none' : '';
    if (parentExists) {
      document.getElementById('new-profile-is-parent').checked = false;
      document.getElementById('new-profile-pin-wrap').classList.add('hidden');
    }
    showScreen('screen-add-profile');
  });
  document.getElementById('btn-back-add-profile').addEventListener('click', () => { renderProfileScreen(); showScreen('screen-profiles'); });
  document.getElementById('new-profile-is-parent').addEventListener('change', e => {
    document.getElementById('new-profile-pin-wrap').classList.toggle('hidden', !e.target.checked);
  });
  document.getElementById('btn-create-profile').addEventListener('click', () => {
    const name = document.getElementById('new-profile-name').value.trim();
    const emoji = document.getElementById('new-profile-emoji').value.trim() || '🙂';
    const isParent = document.getElementById('new-profile-is-parent').checked;
    const pin = document.getElementById('new-profile-pin').value.trim();
    if (!name) { alert('Voer een naam in.'); return; }
    if (isParent && db.profiles.some(p => p.isParent)) { alert('Er bestaat al een ouderprofiel.'); return; }
    if (isParent && pin.length !== 4) { alert('Voer een pincode van 4 cijfers in.'); return; }
    const profile = { id: uid(), name, emoji, isParent };
    if (isParent && pin) profile.pinHash = hashPin(pin);
    db.profiles.push(profile);
    saveData();
    document.getElementById('new-profile-name').value = '';
    document.getElementById('new-profile-emoji').value = '';
    document.getElementById('new-profile-pin').value = '';
    document.getElementById('new-profile-is-parent').checked = false;
    document.getElementById('new-profile-pin-wrap').classList.add('hidden');
    renderProfileScreen();
    showScreen('screen-profiles');
  });

  // PIN keypad
  document.querySelectorAll('.pin-key[data-val]').forEach(btn => {
    btn.addEventListener('click', () => pinKeyPress(btn.dataset.val));
  });
  document.getElementById('btn-pin-cancel').addEventListener('click', () => {
    document.getElementById('pin-overlay').classList.add('hidden');
    pinBuffer = ''; pinCallback = null; delete db._pendingPinProfile;
  });
  document.getElementById('btn-pin-del').addEventListener('click', () => {
    if (pinBuffer.length > 0) { pinBuffer = pinBuffer.slice(0, -1); updatePinDots(); }
  });

  // Home
  document.getElementById('btn-switch-profile').addEventListener('click', () => {
    db.activeProfileId = null; saveData(); renderProfileScreen(); showScreen('screen-profiles');
  });
  document.getElementById('btn-parent-dashboard').addEventListener('click', () => {
    renderParentDashboard(); showScreen('screen-parent');
  });
  document.getElementById('btn-manage').addEventListener('click', () => { renderManage(); showScreen('screen-manage'); });

  // Parent dashboard
  document.getElementById('btn-back-parent').addEventListener('click', () => showScreen('screen-home'));

  // Subject view (parent)
  document.getElementById('btn-back-subject-view').addEventListener('click', () => showScreen('screen-home'));

  // Mode select
  document.getElementById('btn-back-mode').addEventListener('click', () => showScreen('screen-home'));
  document.getElementById('btn-mode-flashcard').addEventListener('click', () => startFlashcards(activeSubjectId));
  document.getElementById('btn-mode-typing').addEventListener('click', () => startQuiz(activeSubjectId, 'typing'));
  document.getElementById('btn-mode-quiz').addEventListener('click', () => startQuiz(activeSubjectId, 'quiz'));

  // Flashcard
  document.getElementById('btn-back-flashcard').addEventListener('click', () => {
    if (confirm('Flashcard-sessie stoppen?')) { renderHome(); showScreen('screen-home'); }
  });
  document.getElementById('flashcard').addEventListener('click', flipFlashcard);
  document.getElementById('flashcard').addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') flipFlashcard(); });
  document.getElementById('btn-fc-wrong').addEventListener('click', () => markFlashcard(false));
  document.getElementById('btn-fc-correct').addEventListener('click', () => markFlashcard(true));

  // Quiz
  document.getElementById('btn-back-quiz').addEventListener('click', () => {
    if (confirm('Quiz stoppen?')) { renderHome(); showScreen('screen-home'); }
  });
  document.getElementById('btn-check').addEventListener('click', checkAnswer);
  document.getElementById('btn-next').addEventListener('click', nextQuestion);
  document.getElementById('btn-retry-answer').addEventListener('click', () => {
    quiz.answered = false;
    quiz.retrying = true;
    const input = document.getElementById('open-answer');
    input.value = '';
    input.className = 'open-input';
    input.readOnly = false;
    input.focus();
    document.getElementById('feedback-area').classList.add('hidden');
    document.getElementById('btn-retry-answer').classList.add('hidden');
    document.getElementById('btn-next').classList.add('hidden');
    document.getElementById('btn-check').classList.remove('hidden');
  });

  // Manage
  document.getElementById('btn-back-manage').addEventListener('click', () => showScreen('screen-home'));
  document.getElementById('btn-add-subject').addEventListener('click', addSubject);
  document.getElementById('btn-add-question').addEventListener('click', addQuestion);
  document.getElementById('btn-export').addEventListener('click', exportData);
  document.getElementById('file-import').addEventListener('change', e => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; });
  document.getElementById('btn-reset-stats').addEventListener('click', () => {
    if (confirm('Voortgang van dit profiel wissen?')) {
      if (db.activeProfileId) delete db.stats[db.activeProfileId];
      saveData(); renderHome(); alert('Voortgang gewist.');
    }
  });
  document.getElementById('q-type').addEventListener('change', e => {
    const type = e.target.value;
    document.getElementById('mc-options').classList.toggle('hidden', type !== 'mc');
    document.getElementById('open-options').classList.toggle('hidden', type !== 'open');
    document.getElementById('tf-options').classList.toggle('hidden', type !== 'truefalse');
  });
});
