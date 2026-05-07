const testWrapper = document.querySelector(".test-wrapper");
const testArea = document.querySelector("#test-area");
const originTextElement = document.querySelector("#origin-text p");
const resetButton = document.querySelector("#reset");
const theTimer = document.querySelector(".timer");
const scoreList = document.querySelector("#score-list");
const wpmDisplay = document.querySelector("#wpm");
const errorDisplay = document.querySelector("#errors");
const ghostWPMDisplay = document.querySelector("#ghost-wpm");
const ghostStatus = document.querySelector("#ghost-status");
const ghostBar = document.querySelector("#ghost-bar");
const userBar = document.querySelector("#user-bar");

const ghostTargetWPM = 40;

const textOptions = [
    "The text to test.",
    "I like Picklesss!",
    "I have pet frogs!",
    "penguins are adorable.",
    "Lions are fluffy.",
    "Who lives in a pineapple under the sea? SpongeBob SquarePants!"
];

let originText = originTextElement.innerHTML;

let timer = [0, 0, 0]; // minutes, seconds, hundredths
let interval;
let timerRunning = false;
let errors = 0;
let previousMistake = false;
let testComplete = false;

// Add leading zero to numbers 9 or below
function leadingZero(time) {
    if (time <= 9) {
        time = "0" + time;
    }

    return time;
}

// Format the timer as 00:00:00
function formatTime() {
    return (
        leadingZero(timer[0]) + ":" +
        leadingZero(timer[1]) + ":" +
        leadingZero(timer[2])
    );
}

// Convert the timer into total hundredths for sorting scores
function getTotalHundredths() {
    return (timer[0] * 60 * 100) + (timer[1] * 100) + timer[2];
}

// Convert the timer into total seconds for WPM
function getTotalSeconds() {
    return (timer[0] * 60) + timer[1] + (timer[2] / 100);
}

// Run a standard minute/second/hundredths timer
function runTimer() {
    theTimer.innerHTML = formatTime();

    timer[2]++;

    if (timer[2] === 100) {
        timer[2] = 0;
        timer[1]++;
    }

    if (timer[1] === 60) {
        timer[1] = 0;
        timer[0]++;
    }

    calculateWPM();
}

// Calculate and display WPM
function calculateWPM() {
    const textEntered = testArea.value;
    const totalCharacters = textEntered.length;
    const totalSeconds = getTotalSeconds();

    if (totalSeconds > 0) {
        const wpm = ((totalCharacters / 5) / (totalSeconds / 60));
        const roundedWPM = Math.round(wpm);

        wpmDisplay.innerHTML = roundedWPM;
        updateGhostRace(roundedWPM);
    } else {
        wpmDisplay.innerHTML = 0;
        updateGhostRace(0);
    }
}

// Update the Ghost Typer visual race
function updateGhostRace(currentWPM) {
    ghostWPMDisplay.innerHTML = ghostTargetWPM;

    let ghostProgress = 70;
    let userProgress = (currentWPM / ghostTargetWPM) * 70;

    if (userProgress > 100) {
        userProgress = 100;
    }

    ghostBar.style.width = ghostProgress + "%";
    userBar.style.width = userProgress + "%";

    if (currentWPM === 0) {
        ghostStatus.innerHTML = "Start typing to race the ghost.";
        userBar.innerHTML = "You";
    } else if (currentWPM >= ghostTargetWPM) {
        ghostStatus.innerHTML = "You are beating the ghost!";
        userBar.innerHTML = "You: " + currentWPM + " WPM";
    } else {
        ghostStatus.innerHTML = "The ghost is ahead!";
        userBar.innerHTML = "You: " + currentWPM + " WPM";
    }

    ghostBar.innerHTML = "Ghost: " + ghostTargetWPM + " WPM";
}

// Get saved scores from localStorage
function getScores() {
    const savedScores = localStorage.getItem("typingScores");

    if (savedScores) {
        return JSON.parse(savedScores);
    }

    return [];
}

// Save the top three scores to localStorage
function saveScore(timeText, totalHundredths) {
    let scores = getScores();

    scores.push({
        time: timeText,
        total: totalHundredths
    });

    scores.sort(function (a, b) {
        return a.total - b.total;
    });

    scores = scores.slice(0, 3);

    localStorage.setItem("typingScores", JSON.stringify(scores));

    displayScores();
}

// Display the top three fastest scores on the page
function displayScores() {
    const scores = getScores();

    scoreList.innerHTML = "";

    if (scores.length === 0) {
        scoreList.innerHTML = "<li>No scores yet</li>";
        return;
    }

    scores.forEach(function (score) {
        const listItem = document.createElement("li");
        listItem.textContent = score.time;
        scoreList.appendChild(listItem);
    });
}

// Match the text entered with the provided text on the page
function spellCheck() {
    const textEntered = testArea.value;
    const originTextMatch = originText.substring(0, textEntered.length);

    if (textEntered === originText && !testComplete) {
        clearInterval(interval);

        timerRunning = false;
        testComplete = true;
        testWrapper.style.borderColor = "#429890"; // green when complete

        calculateWPM();
        saveScore(formatTime(), getTotalHundredths());
    } else if (textEntered === originTextMatch) {
        testWrapper.style.borderColor = "#65CCF3"; // blue while correct
        previousMistake = false;
    } else {
        testWrapper.style.borderColor = "#E95D0F"; // orange/red when incorrect

        if (!previousMistake) {
            errors++;
            errorDisplay.innerHTML = errors;
            previousMistake = true;
        }

        // Sudden Death Mode:
        // If the user makes more than 3 mistakes, reset the test automatically.
        if (errors > 3) {
            alert("Sudden Death! You made more than 3 mistakes. The test will restart.");
            reset();
            return;
        }
    }

    calculateWPM();
}

// Start the timer
function start() {
    const textEnteredLength = testArea.value.length;

    if (textEnteredLength === 0 && !timerRunning && !testComplete) {
        timerRunning = true;
        interval = setInterval(runTimer, 10);
    }
}

// Pick a random paragraph and place it in the origin text area
function randomizeText() {
    const randomIndex = Math.floor(Math.random() * textOptions.length);
    originText = textOptions[randomIndex];
    originTextElement.innerHTML = originText;
}

// Reset everything
function reset() {
    clearInterval(interval);
    interval = null;

    timer = [0, 0, 0];
    timerRunning = false;
    errors = 0;
    previousMistake = false;
    testComplete = false;

    testArea.value = "";
    theTimer.innerHTML = "00:00:00";
    wpmDisplay.innerHTML = 0;
    errorDisplay.innerHTML = 0;
    testWrapper.style.borderColor = "grey";

    updateGhostRace(0);
    randomizeText();
}

// Event listeners for keyboard input and the reset button
testArea.addEventListener("keypress", start, false);
testArea.addEventListener("keyup", spellCheck, false);
resetButton.addEventListener("click", reset, false);

// Load saved scores when the page opens
displayScores();