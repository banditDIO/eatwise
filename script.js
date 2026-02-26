const foods = [
  { name: "Chicken Breast (100g)", calories: 165 },
  { name: "Rice (1 cup)", calories: 200 },
  { name: "Egg (1 large)", calories: 78 },
  { name: "Avocado", calories: 240 },
  { name: "Apple", calories: 95 },
  { name: "Salmon (100g)", calories: 208 },
  { name: "Broccoli (1 cup)", calories: 55 }
];

let totalCalories = 0;
let totalBurned = 0;
let targetCalories = 0;

// Load food options
const foodSelect = document.getElementById("foodSelect");

foods.forEach((food, index) => {
  let option = document.createElement("option");
  option.value = index;
  option.textContent = `${food.name} - ${food.calories} cal`;
  foodSelect.appendChild(option);
});

function calculateCalories() {
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);
  const age = parseFloat(document.getElementById("age").value);
  const gender = document.getElementById("gender").value;
  const goal = document.getElementById("goal").value;

  let bmr;

  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  if (goal === "lose") bmr -= 500;
  if (goal === "gain") bmr += 300;

  targetCalories = Math.round(bmr);

  document.getElementById("calorieResult").innerText =
    "Daily Target Calories: " + targetCalories;

  document.getElementById("targetDisplay").innerText = targetCalories;
}

function addMeal() {
  const index = foodSelect.value;
  const food = foods[index];

  totalCalories += food.calories;

  const li = document.createElement("li");
  li.textContent = food.name + " - " + food.calories + " cal";
  document.getElementById("mealList").appendChild(li);

  updateDisplay();
}

function addWorkout() {
  const select = document.getElementById("workoutSelect");
  const calories = parseInt(select.value);
  const text = select.options[select.selectedIndex].text;

  totalBurned += calories;

  const li = document.createElement("li");
  li.textContent = text;
  document.getElementById("workoutList").appendChild(li);

  updateDisplay();
}

function updateDisplay() {
  document.getElementById("totalCalories").innerText = totalCalories;
  document.getElementById("totalBurned").innerText = totalBurned;

  document.getElementById("consumedDisplay").innerText = totalCalories;
  document.getElementById("burnedDisplay").innerText = totalBurned;

  const net = totalCalories - totalBurned;
  document.getElementById("netDisplay").innerText = net;
}
