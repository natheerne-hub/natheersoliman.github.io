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
    if (badge) badge.textContent = `${rows.length.toLocaleString()} records`;
    if (donut) donut.style.background = `conic-gradient(#4da3ff 0 ${positivePct}%, #1c324b ${positivePct}% 100%)`;
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
        <div class="donut" style="background:conic-gradient(#7dd3fc 0 ${positivePct}%, #1c324b ${positivePct}% 100%)">
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

  const workflowCard = grid.querySelector('.insight-card.wide');
  if (workflowCard) grid.insertBefore(card, workflowCard);
  else grid.appendChild(card);
}

function metricBar(label, value, max, display, extraClass = '') {
  const width = Math.max(4, Math.min(100, value / max * 100));
  return `<div class="live-metric"><div class="live-metric-label"><span>${label}</span><strong>${display}</strong></div><div class="live-track"><b class="${extraClass}" style="width:${width}%"></b></div></div>`;
}

async function initProjectInsights() {
  try {
    const [diabetes, heart] = await Promise.all([
      loadCSV(DATASETS.diabetes),
      loadCSV(DATASETS.heart)
    ]);
    updateDiabetesCard(diabetes);
    createHeartCard(heart);
  } catch (error) {
    console.warn('Live project insight loading failed:', error);
  }
}

document.addEventListener('DOMContentLoaded', initProjectInsights);
