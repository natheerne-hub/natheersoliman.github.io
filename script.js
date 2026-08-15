const DATASETS = {
  diabetes: 'https://raw.githubusercontent.com/natheerne-hub/medical-data-for-diabetes/main/diabetes.csv',
  heart: 'https://raw.githubusercontent.com/natheerne-hub/Heart-Disease-Exploratory-Data-Analysis/main/heart_processed.csv'
};

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((header, i) => [header, values[i]]));
  });
}

function mean(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function pct(value) {
  return `${value.toFixed(1)}%`;
}

async function loadCSV(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Unable to load ${url}`);
  return parseCSV(await response.text());
}

function injectLiveStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .heart-live-grid{display:grid;grid-template-columns:320px 1fr;gap:28px;align-items:center;margin-top:24px}
    .heart-donut-wrap{display:flex;align-items:center;gap:18px}
    .heart-donut-wrap .donut{width:142px;height:142px;flex:0 0 auto}
    .heart-donut-wrap .donut:after{width:92px;height:92px}
    .legend.compact p{font-size:.82rem;margin-bottom:8px}
    .clinical-bars{display:grid;gap:14px}
    .live-metric-label{display:flex;justify-content:space-between;gap:20px;margin-bottom:7px;font-size:.82rem}
    .live-metric-label span{color:#b7c7d9}.live-metric-label strong{color:#fff}
    .live-track{height:9px;border-radius:999px;background:#172b42;overflow:hidden}
    .live-track b{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#2f7df4,#7dd3fc)}
    .live-track b.alt{background:linear-gradient(90deg,#5b8cff,#9cd7ff)}
    code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#b6dcff;background:#10233a;padding:2px 5px;border-radius:6px}
    .project-preview{margin:20px 0 2px;padding:16px;border:1px solid #213a56;border-radius:16px;background:linear-gradient(180deg,#0c1b2d,#091522);overflow:hidden}
    .project-preview-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px}.project-preview-head span{font-size:.72rem;color:#8ea6be;font-weight:750}.project-preview-head strong{font-size:.76rem;color:#cfe7ff}
    .mini-bars{display:grid;gap:10px}.mini-row{display:grid;grid-template-columns:100px 1fr 46px;gap:10px;align-items:center}.mini-row span{font-size:.72rem;color:#9eb1c6}.mini-row em{font-size:.72rem;font-style:normal;color:#eaf3ff;text-align:right}.mini-track{height:8px;border-radius:999px;background:#172b42;overflow:hidden}.mini-track b{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#2f7df4,#7dd3fc)}
    .mini-dots{display:flex;align-items:flex-end;gap:7px;height:78px;padding:8px 4px 0}.mini-dots i{display:block;flex:1;min-width:8px;border-radius:7px 7px 2px 2px;background:linear-gradient(180deg,#7dd3fc,#2f7df4);opacity:.92}.mini-caption{display:flex;justify-content:space-between;font-size:.68rem;color:#71889f;margin-top:6px}
    .project-card.has-preview{min-height:430px}
    @media(max-width:900px){.heart-live-grid{grid-template-columns:1fr}}
    @media(max-width:600px){.heart-donut-wrap{flex-direction:column;align-items:flex-start}.live-metric-label{gap:12px}.mini-row{grid-template-columns:82px 1fr 42px}}
  `;
  document.head.appendChild(style);
}

function updateDiabetesCard(rows) {
  const positive = rows.filter(r => r.Outcome === '1');
  const negative = rows.filter(r => r.Outcome === '0');
  const positivePct = positive.length / rows.length * 100;
  const zeroCounts = {
    Glucose: rows.filter(r => Number(r.Glucose) === 0).length,
    BloodPressure: rows.filter(r => Number(r.BloodPressure) === 0).length,
    BMI: rows.filter(r => Number(r.BMI) === 0).length
  };

  const cards = document.querySelectorAll('#insights .insight-card');
  const outcomeCard = cards[0];
  const qualityCard = cards[1];

  if (outcomeCard) {
    const badge = outcomeCard.querySelector('.data-badge');
    const donut = outcomeCard.querySelector('.donut');
    const donutValue = outcomeCard.querySelector('.donut strong');
    const legend = outcomeCard.querySelectorAll('.legend p');
    if (badge) badge.textContent = `${rows.length.toLocaleString()} records · live`;
    if (donut) donut.style.background = `conic-gradient(#4da3ff 0 ${positivePct}%, #1c3856 ${positivePct}% 100%)`;
    if (donutValue) donutValue.textContent = pct(positivePct);
    if (legend[0]) legend[0].innerHTML = `<i class="dot positive"></i><strong>${positive.length}</strong> diabetes-positive records`;
    if (legend[1]) legend[1].innerHTML = `<i class="dot negative"></i><strong>${negative.length}</strong> diabetes-negative records`;
  }

  if (qualityCard) {
    const rowsEls = qualityCard.querySelectorAll('.metric-list > div');
    const metrics = [
      ['Glucose', zeroCounts.Glucose],
      ['Blood Pressure', zeroCounts.BloodPressure],
      ['BMI', zeroCounts.BMI]
    ];
    rowsEls.forEach((el, index) => {
      const metric = metrics[index];
      if (!metric) return;
      const validPct = (rows.length - metric[1]) / rows.length * 100;
      const label = el.querySelector('span');
      const bar = el.querySelector('.metric-bar b');
      const note = el.querySelector('em');
      if (label) label.textContent = metric[0];
      if (bar) bar.style.width = `${validPct}%`;
      if (note) note.textContent = `${metric[1]} zero values`;
    });
  }
}

function createHeartCard(rows) {
  const grid = document.querySelector('#insights .insight-grid');
  if (!grid || document.getElementById('heart-live-insight')) return;

  const positive = rows.filter(r => r.HeartDisease === '1');
  const negative = rows.filter(r => r.HeartDisease === '0');
  const positivePct = positive.length / rows.length * 100;
  const agePositive = mean(positive.map(r => r.Age));
  const ageNegative = mean(negative.map(r => r.Age));
  const hrPositive = mean(positive.map(r => r.MaxHR));
  const hrNegative = mean(negative.map(r => r.MaxHR));

  const card = document.createElement('article');
  card.className = 'insight-card wide live-heart-card';
  card.id = 'heart-live-insight';
  card.innerHTML = `
    <div class="insight-head">
      <div><p class="tag">Heart Disease dataset</p><h3>Cardiovascular outcome snapshot</h3></div>
      <span class="data-badge">${rows.length.toLocaleString()} records · live</span>
    </div>
    <div class="heart-live-grid">
      <div class="heart-donut-wrap">
        <div class="donut" style="background:conic-gradient(#7dd3fc 0 ${positivePct}%, #1c3856 ${positivePct}% 100%)">
          <div><strong>${pct(positivePct)}</strong><span>Heart disease</span></div>
        </div>
        <div class="legend compact">
          <p><i class="dot positive"></i><strong>${positive.length}</strong> heart-disease records</p>
          <p><i class="dot negative"></i><strong>${negative.length}</strong> no-disease records</p>
        </div>
      </div>
      <div class="clinical-bars">
        ${metricBar('Mean age · No disease', ageNegative, 80, ageNegative.toFixed(1))}
        ${metricBar('Mean age · Disease', agePositive, 80, agePositive.toFixed(1), 'alt')}
        ${metricBar('Mean MaxHR · No disease', hrNegative, 200, hrNegative.toFixed(1))}
        ${metricBar('Mean MaxHR · Disease', hrPositive, 200, hrPositive.toFixed(1), 'alt')}
      </div>
    </div>
    <p class="note">Generated directly from <code>heart_processed.csv</code> in the published GitHub repository. Descriptive only; not a diagnostic claim.</p>`;

  const workflowCard = Array.from(grid.querySelectorAll('.insight-card')).find(el => el.querySelector('.workflow'));
  if (workflowCard) grid.insertBefore(card, workflowCard);
  else grid.appendChild(card);
}

function metricBar(label, value, max, display, extraClass = '') {
  const width = Math.max(4, Math.min(100, value / max * 100));
  return `<div class="live-metric"><div class="live-metric-label"><span>${label}</span><strong>${display}</strong></div><div class="live-track"><b class="${extraClass}" style="width:${width}%"></b></div></div>`;
}

function miniBar(label, value, max, display) {
  const width = Math.max(4, Math.min(100, value / max * 100));
  return `<div class="mini-row"><span>${label}</span><div class="mini-track"><b style="width:${width}%"></b></div><em>${display}</em></div>`;
}

function addProjectPreviews(diabetesRows, heartRows) {
  const cards = document.querySelectorAll('#projects .project-card');
  const heartCard = cards[0];
  const diabetesCard = cards[1];

  if (heartCard && !heartCard.querySelector('.project-preview')) {
    const pos = heartRows.filter(r => r.HeartDisease === '1');
    const neg = heartRows.filter(r => r.HeartDisease === '0');
    const age1 = mean(pos.map(r => r.Age));
    const age0 = mean(neg.map(r => r.Age));
    const preview = document.createElement('div');
    preview.className = 'project-preview';
    preview.innerHTML = `
      <div class="project-preview-head"><span>Live dataset preview</span><strong>${heartRows.length} rows</strong></div>
      <div class="mini-bars">
        ${miniBar('No disease', neg.length, Math.max(pos.length, neg.length), neg.length)}
        ${miniBar('Disease', pos.length, Math.max(pos.length, neg.length), pos.length)}
        ${miniBar('Mean age 0', age0, 80, age0.toFixed(1))}
        ${miniBar('Mean age 1', age1, 80, age1.toFixed(1))}
      </div>`;
    heartCard.classList.add('has-preview');
    const tech = heartCard.querySelector('.project-tech');
    heartCard.insertBefore(preview, tech);
  }

  if (diabetesCard && !diabetesCard.querySelector('.project-preview')) {
    const bins = [60,80,100,120,140,160,180,200];
    const counts = bins.map((upper, index) => {
      const lower = index === 0 ? 0 : bins[index - 1];
      return diabetesRows.filter(r => Number(r.Glucose) > lower && Number(r.Glucose) <= upper).length;
    });
    const maxCount = Math.max(...counts, 1);
    const preview = document.createElement('div');
    preview.className = 'project-preview';
    preview.innerHTML = `
      <div class="project-preview-head"><span>Glucose distribution</span><strong>${diabetesRows.length} rows</strong></div>
      <div class="mini-dots">${counts.map(v => `<i style="height:${Math.max(8, v / maxCount * 100)}%"></i>`).join('')}</div>
      <div class="mini-caption"><span>Low glucose</span><span>Higher glucose</span></div>`;
    diabetesCard.classList.add('has-preview');
    const tech = diabetesCard.querySelector('.project-tech');
    diabetesCard.insertBefore(preview, tech);
  }
}

async function initProjectInsights() {
  injectLiveStyles();
  try {
    const [diabetes, heart] = await Promise.all([
      loadCSV(DATASETS.diabetes),
      loadCSV(DATASETS.heart)
    ]);
    updateDiabetesCard(diabetes);
    createHeartCard(heart);
    addProjectPreviews(diabetes, heart);
  } catch (error) {
    console.warn('Live project insight loading failed:', error);
  }
}

document.addEventListener('DOMContentLoaded', initProjectInsights);
