/* EatWise – front-end logic
   - Loads foods JSON
   - Planner (Mifflin-St Jeor BMR + activity + goal adjustment)
   - Macro split defaults: 30% protein, 40% carbs, 30% fat (editable easily)
   - Add/remove foods to the day, simple balancing
   - Save/Load via localStorage
*/

const el = (sel) => document.querySelector(sel);
const els = (sel) => Array.from(document.querySelectorAll(sel));
const byId = (id) => document.getElementById(id);

const state = {
  foods: [],
  day: [], // {name, grams, calories, protein, carbs, fat}
  targets: { kcal: 0, protein: 0, carbs: 0, fat: 0 }
};

const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  athlete: 1.9
};

const goalAdjustments = {
  cut: -0.15,       // -15% from TDEE
  recomp: 0.0,      // maintain
  bulk: +0.10       // +10% surplus
};

function clamp(n, min, max){ return Math.min(Math.max(n, min), max); }

async function loadFoods(){
  const res = await fetch('data/foods.json');
  const json = await res.json();
  state.foods = json;
  renderResults(json);
}

function renderResults(list){
  const wrap = byId('results');
  wrap.innerHTML = '';
  const tpl = byId('foodTpl');

  list.forEach(f => {
    const node = tpl.content.cloneNode(true);
    node.querySelector('.name').textContent = f.name;
    node.querySelector('.cal').textContent = f.calories;
    node.querySelector('.pro').textContent = f.protein;
    node.querySelector('.carb').textContent = f.carbs;
    node.querySelector('.fat').textContent = f.fat;

    const addBtn = node.querySelector('.addBtn');
    addBtn.addEventListener('click', () => addFoodToDay(f.name, 100)); // default 100g
    wrap.appendChild(node);
  });
}

function filterFoods(){
  const q = byId('search').value.trim().toLowerCase();
  const hiP = byId('hiProtein').checked;
  const lowC = byId('lowCal').checked;

  let list = state.foods.filter(f => f.name.toLowerCase().includes(q));
  if (hiP) list = list.filter(f => f.protein >= 10);   // >=10g protein per 100g
  if (lowC) list = list.filter(f => f.calories <= 80); // <=80 kcal per 100g
  renderResults(list);
}

function calcTargets(ev){
  ev?.preventDefault();
  const sex = byId('sex').value;
  const age = +byId('age').value;
  const h = +byId('height').value;
  const w = +byId('weight').value;
  const activity = byId('activity').value;
  const goal = byId('goal').value;

  // Mifflin-St Jeor
  const s = (sex === 'male') ? 5 : -161;
  const bmr = (10*w) + (6.25*h) - (5*age) + s;

  const tdee = bmr * activityMultipliers[activity];
  const adj = goalAdjustments[goal] || 0;
  const targetKcal = Math.round(tdee * (1 + adj));

  // Macro split: 30/40/30
  const proteinKcal = Math.round(targetKcal * 0.30);
  const carbsKcal   = Math.round(targetKcal * 0.40);
  const fatKcal     = targetKcal - proteinKcal - carbsKcal;

  state.targets = {
    kcal: targetKcal,
    protein: Math.round(proteinKcal / 4),
    carbs:   Math.round(carbsKcal / 4),
    fat:     Math.round(fatKcal / 9)
  };
  updateTargetsUI();
}

function updateTargetsUI(){
  byId('kcalTarget').textContent = state.targets.kcal;
  byId('proteinTarget').textContent = state.targets.protein;
  byId('carbTarget').textContent = state.targets.carbs;
  byId('fatTarget').textContent = state.targets.fat;
  el('#targets').classList.remove('hidden');
}

function addFoodToDay(name, grams){
  const f = state.foods.find(x => x.name === name);
  if (!f) return;
  const factor = grams / 100;

  state.day.push({
    name: f.name,
    grams,
    calories: +(f.calories * factor).toFixed(1),
    protein: +(f.protein * factor).toFixed(1),
    carbs: +(f.carbs * factor).toFixed(1),
    fat: +(f.fat * factor).toFixed(1)
  });
  renderDay();
}

function removeFoodFromDay(idx){
  state.day.splice(idx, 1);
  renderDay();
}

function updateGrams(idx, grams){
  grams = clamp(+grams || 0, 0, 2000);
  const orig = state.foods.find(x => x.name === state.day[idx].name);
  const factor = grams / 100;
  state.day[idx] = {
    ...state.day[idx],
    grams,
    calories: +(orig.calories * factor).toFixed(1),
    protein: +(orig.protein * factor).toFixed(1),
    carbs: +(orig.carbs * factor).toFixed(1),
    fat: +(orig.fat * factor).toFixed(1)
  };
  renderDay();
}

function renderDay(){
  const list = byId('mealList');
  list.innerHTML = '';

  const totals = state.day.reduce((a,x)=>({
    calories: a.calories + x.calories,
    protein: a.protein + x.protein,
    carbs: a.carbs + x.carbs,
    fat: a.fat + x.fat
  }), {calories:0, protein:0, carbs:0, fat:0});

  state.day.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'meal';

    li.innerHTML = `
      <div class="meal-row">
        <strong>${item.name}</strong>
        <div class="grow"></div>
        <input class="gInput" type="number" min="0" max="2000" value="${item.grams}" aria-label="grams"> g
        <button class="mini" data-idx="${idx}">Remove</button>
      </div>
      <div class="meal-kpis">
        <span>${item.calories} kcal</span>
        <span>${item.protein} g P</span>
        <span>${item.carbs} g C</span>
        <span>${item.fat} g F</span>
      </div>
    `;

    li.querySelector('button').addEventListener('click', e => {
      const i = +e.currentTarget.dataset.idx;
      removeFoodFromDay(i);
    });

    li.querySelector('.gInput').addEventListener('input', e => {
      updateGrams(idx, e.target.value);
    });

    list.appendChild(li);
  });

  // Totals row
  const totalLi = document.createElement('li');
  totalLi.className = 'meal total';
  totalLi.innerHTML = `
    <div class="meal-row"><strong>Totals</strong></div>
    <div class="meal-kpis">
      <span><strong>${totals.calories.toFixed(0)}</strong> kcal</span>
      <span><strong>${totals.protein.toFixed(0)}</strong> g P</span>
      <span><strong>${totals.carbs.toFixed(0)}</strong> g C</span>
      <span><strong>${totals.fat.toFixed(0)}</strong> g F</span>
    </div>
  `;
  list.appendChild(totalLi);

  byId('dayPlan').classList.remove('hidden');
}

function generateSampleDay(){
  // pick a breakfast + lunch + dinner + snack from categories (defined in foods.json)
  const cats = { breakfast:[], lunch:[], dinner:[], snack:[] };
  state.foods.forEach(f => {
    (cats[f.category] || (cats[f.category] = [])).push(f);
  });

  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  state.day = [];

  const picks = [
    {f: pick(cats.breakfast || state.foods), grams: 200},
    {f: pick(cats.lunch || state.foods), grams: 250},
    {f: pick(cats.dinner || state.foods), grams: 250},
    {f: pick(cats.snack || state.foods), grams: 100}
  ].filter(x => x.f);

  picks.forEach(p => addFoodToDay(p.f.name, p.grams));
}

function savePlan(){
  const data = {
    targets: state.targets,
    day: state.day
  };
  localStorage.setItem('eatwise_plan', JSON.stringify(data));
  alert('Plan saved on this device ✅');
}

function loadPlan(){
  const raw = localStorage.getItem('eatwise_plan');
  if(!raw){ alert('No saved plan found'); return; }
  const data = JSON.parse(raw);
  state.targets = data.targets || state.targets;
  state.day = data.day || [];
  updateTargetsUI();
  renderDay();
}

function clearPlan(){
  localStorage.removeItem('eatwise_plan');
  alert('Saved plan cleared.');
}

// --- Events & init ---
window.addEventListener('DOMContentLoaded', () => {
  byId('year').textContent = new Date().getFullYear();
  loadFoods();

  byId('plannerForm').addEventListener('submit', calcTargets);
  byId('genDay').addEventListener('click', generateSampleDay);
  byId('savePlan').addEventListener('click', savePlan);
  byId('loadPlan').addEventListener('click', loadPlan);
  byId('clearPlan').addEventListener('click', clearPlan);

  byId('search').addEventListener('input', filterFoods);
  byId('hiProtein').addEventListener('change', filterFoods);
  byId('lowCal').addEventListener('change', filterFoods);
});

Add a little CSS for the meal list inside styles.css (append at the end if you like):
.mealplan ul{ list-style:none; margin:0; padding:0; display:grid; gap:8px }
.meal{
  background:#0b1320; border:1px solid var(--border); border-radius:10px; padding:10px;
}
.meal-row{ display:flex; gap:10px; align-items:center }
.meal-row .grow{ flex:1 }
.gInput{
  width:90px; padding:6px 8px; border-radius:8px; border:1px solid var(--border);
  background:#091524; color:var(--text); margin-right:8px;
}
.meal-kpis{ display:flex; gap:16px; color:var(--muted); margin-top:6px }
.meal.total{ border:1px dashed #35506b; background:#0a1522 }
