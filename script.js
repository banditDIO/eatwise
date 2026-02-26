document.addEventListener("DOMContentLoaded", () => {

  const foods = [
    { name: "Chicken Breast (100g)", calories: 165, protein: 31, carbs: 0, fats: 3.6 },
    { name: "Rice (1 cup)", calories: 200, protein: 4, carbs: 45, fats: 0.4 },
    { name: "Egg (1 large)", calories: 78, protein: 6, carbs: 1, fats: 5 },
    { name: "Avocado", calories: 240, protein: 3, carbs: 12, fats: 22 },
    { name: "Apple", calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
    { name: "Salmon (100g)", calories: 208, protein: 20, carbs: 0, fats: 13 },
    { name: "Broccoli (1 cup)", calories: 55, protein: 4, carbs: 11, fats: 0.5 }
  ];

  let state = JSON.parse(localStorage.getItem("eatwise")) || {
    totalCalories: 0,
    totalBurned: 0,
    targetCalories: 0
  };

  const foodSelect = document.getElementById("foodSelect");
  const mealList = document.getElementById("mealList");
  const workoutList = document.getElementById("workoutList");

  // Load foods
  foods.forEach((food, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${food.name} - ${food.calories} cal`;
    foodSelect.appendChild(option);
  });

  function saveState() {
    localStorage.setItem("eatwise", JSON.stringify(state));
  }

  function calculateCalories() {
    const weight = +document.getElementById("weight").value;
    const height = +document.getElementById("height").value;
    const age = +document.getElementById("age").value;
    const gender = document.getElementById("gender").value;
    const activity = +document.getElementById("activity").value;
    const goal = document.getElementById("goal").value;

    if (!weight || !height || !age) {
      alert("Please fill all profile fields.");
      return;
    }

    let bmr = gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

    let tdee = bmr * activity;

    if (goal === "lose") tdee -= 500;
    if (goal === "gain") tdee += 300;

    state.targetCalories = Math.round(tdee);

    document.getElementById("calorieResult").innerText =
      `Daily Target: ${state.targetCalories} kcal`;

    const protein = (state.targetCalories * 0.3 / 4).toFixed(0);
    const carbs = (state.targetCalories * 0.4 / 4).toFixed(0);
    const fats = (state.targetCalories * 0.3 / 9).toFixed(0);

    document.getElementById("macroResult").innerText =
      `Macros → Protein: ${protein}g | Carbs: ${carbs}g | Fats: ${fats}g`;

    saveState();
    updateDisplay();
  }

  function addMeal() {
    const food = foods[foodSelect.value];
    state.totalCalories += food.calories;

    const li = document.createElement("li");
    li.innerHTML = `${food.name} - ${food.calories} cal 
      <button class="remove">x</button>`;

    li.querySelector(".remove").addEventListener("click", () => {
      state.totalCalories -= food.calories;
      li.remove();
      updateDisplay();
    });

    mealList.appendChild(li);
    updateDisplay();
  }

  function addWorkout() {
    const select = document.getElementById("workoutSelect");
    const calories = +select.value;
    const text = select.options[select.selectedIndex].text;

    state.totalBurned += calories;

    const li = document.createElement("li");
    li.innerHTML = `${text} <button class="remove">x</button>`;

    li.querySelector(".remove").addEventListener("click", () => {
      state.totalBurned -= calories;
      li.remove();
      updateDisplay();
    });

    workoutList.appendChild(li);
    updateDisplay();
  }

  function updateDisplay() {
    document.getElementById("totalCalories").innerText = state.totalCalories;
    document.getElementById("totalBurned").innerText = state.totalBurned;

    document.getElementById("consumedDisplay").innerText = state.totalCalories;
    document.getElementById("burnedDisplay").innerText = state.totalBurned;
    document.getElementById("targetDisplay").innerText = state.targetCalories;

    document.getElementById("netDisplay").innerText =
      state.totalCalories - state.totalBurned;

    saveState();
  }

  document.getElementById("calculateBtn").addEventListener("click", calculateCalories);
  document.getElementById("addMealBtn").addEventListener("click", addMeal);
  document.getElementById("addWorkoutBtn").addEventListener("click", addWorkout);

  updateDisplay();
});
