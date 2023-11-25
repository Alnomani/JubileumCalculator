// Get references to elements
const formRow = document.getElementById("form-row");
const mainForm = document.getElementById("main-form");
const resetButton = document.getElementById("reset-list");
const calculateJubileumButton = document.getElementById("calculate-jubileum");
const jubileumList = document.getElementById("jubileum-list");
const errorMessageElement = document.getElementById("error-message");

// Regex for validation
const LETTERS_ONLY = /^[A-Za-z\s]{2,26}$/;
const CORRECT_DATE_FORMAT = /^\d{2}-\d{2}-\d{4}$/;
const DAYS_IN_A_YEAR = 365.2524;

let listOfNames = [];
let birthDayList = [];
let youngestIndex = 0;

mainForm.addEventListener("submit", (event) => {
  event.preventDefault();
  errorMessageElement.innerHTML = "";
  clearJubileumList();
  retrieveAndUpdateData();
});

resetButton.addEventListener("click", () => {
  if (birthDayList.length == 0) {
    return;
  }
  clearPersonElementList();
  clearJubileumList();
  birthDayList = [];
  listOfNames = [];
  youngestIndex = 0;
});

calculateJubileumButton.addEventListener("click", () => {
  if (birthDayList.length == 0) {
    errorMessageElement.innerHTML = "Geen data in de lijst om mee te rekenen.";
    return;
  }
  clearJubileumList();
  // How old are the others when the youngest is born.
  const startingAges = getStartingAgesBasedOnYoungest();
  const ageSum = getArraySum(startingAges);
  calculateAndAddJubileums(startingAges, ageSum);
  showErrorWhenNoOuput();
});

function showErrorWhenNoOuput() {
  if (!jubileumList.lastChild) {
    errorMessageElement.innerHTML =
      "Datums te ver uit elkaar om jubilea te berekenen.";
  } else {
    errorMessageElement.innerHTML = "";
  }
}

function calculateAndAddJubileums(startingAges, ageSum) {
  for (let i = 50; i < 450; i += 50) {
    // How many days per person does it take to reach the next jubileum given starting ages.
    const dayOffsetFromJubileum =
      (i * DAYS_IN_A_YEAR - ageSum) / birthDayList.length;
    let startinAgeSumTooHigh = dayOffsetFromJubileum < 0;
    // if negative offset skip to next jubileum (e.g. one person is older than 50)
    if (startinAgeSumTooHigh) {
      continue;
    }
    let offsetAgesInDays = getAgesAtNewJubileum(
      startingAges,
      dayOffsetFromJubileum
    );
    // return if person is too old.
    if (!offsetAgesInDays) {
      return;
    }
    // returns formatted jubileum date
    let currentJubDate = offsetAndFormatDate(
      birthDayList[youngestIndex],
      dayOffsetFromJubileum
    );
    // format complete string, create and add corresponding list element
    let formattedAgeString = createFormattedAgeString(offsetAgesInDays);
    addJubListElement(
      `${i} jaar op ${currentJubDate} (` + formattedAgeString + ")"
    );
  }
}

function retrieveAndUpdateData() {
  // retrieve input values and validate
  const nameString = document.getElementById("name").value.trim();
  const birthdateString = document.getElementById("birthdate").value.trim();
  if (dataInputInvalid(nameString, birthdateString)) {
    return;
  }
  // add data
  addDataRow(nameString, birthdateString);
  const currentDate = updateLists(nameString, birthdateString);
  updateYoungestIndex(currentDate);
}

function updateLists(nameString, birthdateString) {
  const currentDate = new Date(birthdateString.split("-").reverse().join("-"));
  listOfNames.push(nameString);
  birthDayList.push(currentDate);
  return currentDate;
}

function updateYoungestIndex(currentDate) {
  // Keep track of the youngest person in the list by index
  if (birthDayList.length > 1 && birthDayList[youngestIndex] < currentDate) {
    youngestIndex += 1;
  }
}

function clearJubileumList() {
  while (jubileumList.lastChild) {
    jubileumList.lastChild.remove();
  }
}

function clearPersonElementList() {
  // Don't remove column names such as "Naam: "
  while (
    formRow.previousElementSibling &&
    formRow.previousElementSibling.id !== "column-names"
  ) {
    formRow.previousElementSibling.remove();
  }
}

function getArraySum(array) {
  if (array.length == 1) {
    return [array[0]];
  }
  let ageSum = 0;
  return array.reduce((ageSum, currentAge) => (ageSum += currentAge));
}

function getStartingAgesBasedOnYoungest() {
  return birthDayList.map((currentDate) => {
    return dateDifferenceBetween(birthDayList[youngestIndex], currentDate);
  });
}

function tooOld(age) {
  return age > 105 * DAYS_IN_A_YEAR;
}

function getAgesAtNewJubileum(startingAges, dayOffsetFromJubileum) {
  // increment all startingAge dates by day offset
  let offsetAgesInDays = [];
  for (let i = 0; i < startingAges.length; i++) {
    let newAge = startingAges[i] + dayOffsetFromJubileum;
    if (tooOld(newAge)) {
      return null;
    }
    offsetAgesInDays.push(newAge);
  }
  return offsetAgesInDays;
}

function createFormattedAgeString(offsetAgesInDays) {
  let ageString = "";
  for (let i = 0; i < birthDayList.length; i++) {
    ageString += `${listOfNames[i]}: ${(
      (offsetAgesInDays[i] - 1) /
      DAYS_IN_A_YEAR
    ).toFixed(2)}, `;
  }
  // slice to remove trailing comma and whitespace
  return ageString.slice(0, -2);
}

function addJubListElement(output) {
  let listItem = document.createElement("li");
  listItem.innerHTML = output;
  jubileumList.appendChild(listItem);
}

function offsetAndFormatDate(date, offset) {
  // convert to UTC and remove time zone info and time.
  let formattedDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + offset)
  )
    .toISOString()
    .split("T", 1)[0];
  // format to dd-mm-yyyy
  return formattedDate.split("-").reverse().join("-");
}

function addDataRow(nameString, birthdateString) {
  const newRow = document.createElement("tr");
  const nameElement = document.createElement("td");
  const birthdateElement = document.createElement("td");

  nameElement.appendChild(document.createTextNode(nameString));
  birthdateElement.appendChild(document.createTextNode(birthdateString));
  newRow.appendChild(nameElement);
  newRow.appendChild(birthdateElement);
  // Insert newly created row before form-row element.
  formRow.parentNode.insertBefore(newRow, formRow);
}

function dataInputInvalid(name, birthdate) {
  if (!LETTERS_ONLY.test(name)) {
    errorMessageElement.innerHTML =
      "De naam mag alleen letters of spaties bevatten en tussen de 2 en 26 karakters zijn.";
    return true;
  }
  if (!dateIsValid(birthdate)) {
    errorMessageElement.innerHTML =
      "Onjuist formaat of onjuiste datum. dd-mm-jjjj formaat verwacht.";
    return true;
  }
  return false;
}

function getDateWithoutTimeZone(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateDifferenceBetween(firstDate, secondDate) {
  const strippedFirstDate = getDateWithoutTimeZone(firstDate);
  const strippedSecondDate = getDateWithoutTimeZone(secondDate);
  const MILLISECS_PER_DAY = 1000 * 60 * 60 * 24;
  return (strippedFirstDate - strippedSecondDate) / MILLISECS_PER_DAY;
}

function dateIsValid(date) {
  if (!CORRECT_DATE_FORMAT.test(date)) {
    return false;
  }
  // format string so that it can be accepted by the Date object(american format)
  const dateObject = new Date(date.split("-").reverse().join("-"));
  if (!(dateObject instanceof Date && !isNaN(dateObject.getTime()))) {
    return false;
  }
  return true;
}
