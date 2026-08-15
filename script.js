const DATASETS = {
  diabetes: 'https://raw.githubusercontent.com/natheerne-hub/medical-data-for-diabetes/main/diabetes.csv',
  heart: 'https://raw.githubusercontent.com/natheerne-hub/Heart-Disease-Exploratory-Data-Analysis/main/heart_processed.csv'
};

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
}

function mean(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function format1(value) {
  return Number(value).toFixed(1);
}

function barChart(target, items, maxValue, suffix = '') {
  const el = document.querySelector(target);
  if (!el) return;
  el.innerHTML = items.map(item => {
    const pct = maxValue ? Math.max(3, (item.value / maxValue) * 100) : 0;
    return `
      <div class="viz-row">
        <div class="viz-label"><span>${item.label}</span><strong>${item.display ?? format1(item.value)}${suffix}</strong></div>
        <div class="viz-track"><span class="viz-fill ${item.className || ''}" style="width:${pct}%"></span></div>
      </div>`;
  }).join('');
}

function setMetric(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function renderDiabetes() {
  const response = await fetch(DATASETS.diabetes);
  if (!response.ok) throw new Error('Diabetes dataset unavailable');
  const rows = parseCSV(await response.text());
  const positive = rows.filter(r => r.Outcome === '1');
  const negative = rows.filter(r => r.Outcome === '0');
  const prevalence = rows.length ? (positive.length / rows.length) * 100 : 0;
  const glucose0 = mean(negative.map(r => r.Glucose).filter(v => Number(v) > 0));
  const glucose1 = mean(positive.map(r => r.Glucose).filter(v => Number(v) > 0));

  setMetric('diabetes-n', rows.length.toLocaleString());
  setMetric('diabetes-prev', `${format1(prevalence)}%`);
  setMetric('diabetes-positive', positive.length.toLocaleString());

  barChart('#diabetes-bars', [
    { label: 'No diabetes outcome', value: negative.length, display: negative.length, className: 'soft' },
    { label: 'Diabetes outcome', value: positive.length, display: positive.length, className: 'accent' }
  ], Math.max(negative.length, positive.length));

  barChart('#diabetes-glucose', [
    { label: 'Mean glucose · Outcome 0', value: glucose0, display: format1(glucose0), className: 'soft' },
    { label: 'Mean glucose · Outcome 1', value: glucose1, display: format1(glucose1), className: 'accent' }
  ], Math.max(glucose0, glucose1));
}

async function renderHeart() {
  const response = await fetch(DATASETS.heart);
  if (!response.ok) throw new Error('Heart dataset unavailable');
  const rows = parseCSV(await response.text());
  const positive = rows.filter(r => r.HeartDisease === '1');
  const negative = rows.filter(r => r.HeartDisease === '0');
  const prevalence = rows.length ? (positive.length / rows.length) * 100 : 0;
  const age0 = mean(negative.map(r => r.Age));
  const age1 = mean(positive.map(r => r.Age));
  const maxhr0 = mean(negative.map(r => r.MaxHR));
  const maxhr1 = mean(positive.map(r => r.MaxHR));

  setMetric('heart-n', rows.length.toLocaleString());
  setMetric('heart-prev', `${format1(prevalence)}%`);
  setMetric('heart-positive', positive.length.toLocaleString());

  barChart('#heart-bars', [
    { label: 'No heart disease', value: negative.length, display: negative.length, className: 'soft' },
    { label: 'Heart disease', value: positive.length, display: positive.length, className: 'accent' }
  ], Math.max(negative.length, positive.length));

  barChart('#heart-clinical', [
    { label: 'Mean age · No disease', value: age0, display: format1(age0), className: 'soft' },
    { label: 'Mean age · Disease', value: age1, display: format1(age1), className: 'accent' },
    { label: 'Mean MaxHR · No disease', value: maxhr0, display: format1(maxhr0), className: 'soft2' },
    { label: 'Mean MaxHR · Disease', value: maxhr1, display: format1(maxhr1), className: 'accent2' }
  ], Math.max(maxhr0, maxhr1));
}

function showDataError(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = '<p class="data-error">Live project data could not be loaded. Open the repository to inspect the source dataset.</p>';
}

renderDiabetes().catch(() => showDataError('diabetes-visual'));
renderHeart().catch(() => showDataError('heart-visual'));
