// Bakeoff #3 - Escrita em Smartwatches
// IPM 2020-21, Semestre 2
// Entrega: até dia 4 de Junho às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 31 de Maio

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER = 31; // add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY = false; // set to 'true' before sharing during the simulation and bake-off days

let PPI, PPCM; // pixel density (DO NOT CHANGE!)
let second_attempt_button; // button that starts the second attempt (DO NOT CHANGE!)

// Finger parameters (DO NOT CHANGE!)
let finger_img; // holds our finger image that simules the 'fat finger' problem
let FINGER_SIZE, FINGER_OFFSET; // finger size and cursor offsett (calculated after entering fullscreen)

// Arm parameters (DO NOT CHANGE!)
let arm_img; // holds our arm/watch image
let ARM_LENGTH, ARM_HEIGHT; // arm size and position (calculated after entering fullscreen)

// Study control parameters (DO NOT CHANGE!)
let draw_finger_arm = false; // used to control what to show in draw()
let phrases = []; // contains all 501 phrases that can be asked of the user
let current_trial = 0; // the current trial out of 2 phrases (indexes into phrases array above)
let attempt = 0; // the current attempt out of 2 -> to account for practice
let target_phrase = ""; // the current target phrase
let currently_typed = ""; // what the user has typed so far
let entered = new Array(2); // array to store the result of the two trials (i.e., the two phrases entered in one attempt)
let CPS = 0; // add the characters per second (CPS) here (once for every attempt)

// Metrics
let attempt_start_time, attempt_end_time; // attemps start and end times (includes both trials)
let trial_end_time; // the timestamp of when the lastest trial was completed
let letters_entered = 0; // running number of letters entered (for final WPM computation)
let letters_expected = 0; // running number of letters expected (from target phrase)
let errors = 0; // a running total of the number of errors (when hitting 'ACCEPT')
let database; // Firebase DB

// 2D Keyboard UI
//let leftArrow, rightArrow;     // holds the left and right UI images for our basic 2D keyboard
//let ARROW_SIZE;                // UI button size
//let current_letter = 'a';      // current char being displayed on our basic 2D keyboard (starts with 'a')

// Auto complete endpoint
const autoCompleteWebServer = "https://auto-complete-dv.herokuapp.com/";

//Our keyboard
let img_keyboard;
let last_press;
let last_clicked;
let double_click_delay = 750;

let BASE_WIDTH;
let BASE_HEIGHT;
let BT_WIDTH;
let BT_HEIGHT;

let current_word = "";
let suggested_words = [];

// Runs once before the setup() and loads our data (images, phrases)
function preload() {
  // Loads simulation images (arm, finger) -- DO NOT CHANGE!
  arm = loadImage("data/arm_watch.png");
  fingerOcclusion = loadImage("data/finger.png");

  // Loads the target phrases (DO NOT CHANGE!)
  phrases = loadStrings("data/phrases.txt");

  // Loads UI elements for our basic keyboard
  leftArrow = loadImage("data/left.png");
  rightArrow = loadImage("data/right.png");

  //Loads custom keyboards
  img_keyboard = loadImage("./keyboards/Versao4.png");

}

// Runs once at the start
function setup() {
  createCanvas(700, 500); // window size in px before we go into fullScreen()
  frameRate(60); // frame rate (DO NOT CHANGE!)

  // DO NOT CHANGE THESE!
  shuffle(phrases, true); // randomize the order of the phrases list (N=501)
  target_phrase = phrases[current_trial];

  drawUserIDScreen(); // draws the user input screen (student number and display size)

  autocomplete();
}

function draw() {
  if (draw_finger_arm) {
    background(255); // clear background
    noCursor(); // hides the cursor to simulate the 'fat finger'

    drawArmAndWatch(); // draws arm and watch background
    writeTargetAndEntered(); // writes the target and entered phrases above the watch
    drawACCEPT(); // draws the 'ACCEPT' button that submits a phrase and completes a trial

    // Draws the non-interactive screen area (4x1cm) -- DO NOT CHANGE SIZE!
    noStroke();
    fill(125);
    rect(width/2 - 2.0*PPCM, height/2 - 2.0*PPCM, 4.0*PPCM, 1.0*PPCM);
    textAlign(CENTER, CENTER);
    textFont("Arial", 14);
    fill(0);
    text("Swipe left to delete", width/2, height/2 - 1.3 * PPCM);

    // Draws the touch input area (4x3cm) -- DO NOT CHANGE SIZE!
    stroke(0, 255, 0);
    noFill();
    rect(
      width / 2 - 2.0 * PPCM,
      height / 2 - 1.0 * PPCM,
      4.0 * PPCM,
      3.0 * PPCM
    );

    draw2Dkeyboard(); // draws our basic 2D keyboard UI

    drawFatFinger(); // draws the finger that simulates the 'fat finger' problem
  }
}

// Draws 2D keyboard UI (current letter and left and right arrows)
function draw2Dkeyboard() {
  ///Writes the current letter
  //textFont("Arial", 24);
  //fill(0);
  //text("" + current_letter, width/2, height/2);

  ///Draws and the left and right arrow buttons
  //noFill();
  //imageMode(CORNER);
  //image(leftArrow, width/2 - ARROW_SIZE, height/2, ARROW_SIZE, ARROW_SIZE);
  //image(rightArrow, width/2, height/2, ARROW_SIZE, ARROW_SIZE);
  let height_words = height / 2 - (1.0 - 0.592 / 2) * PPCM;

  imageMode(CENTER);
  image(
    img_keyboard,
    width / 2,
    height / 2 + 0.5 * PPCM,
    4.0 * PPCM,
    3.0 * PPCM
  );

  fill(0);

  if (suggested_words.length !== 0) {

    let max_len = Math.max(...suggested_words)

    //if (max_len >= 8) textFont("Arial", 13);
    //else if (max_len >= 6) textFont("Arial", 17);
    //else textFont("Arial", 20);

    textFont("Arial", 0.35 * PPCM * (1/max_len))

    switch (suggested_words.length) {

      case 3:
        textAlign(CENTER, CENTER);
        text(suggested_words[2], width / 2 + (12/11)*((4/3)*PPCM)/2 , height_words, (4/3)*PPCM);
        textAlign(CENTER);

      case 2:
        textAlign(CENTER, CENTER);
        text(suggested_words[1], width / 2 - ((4/3)*PPCM)/2, height_words, (4/3)*PPCM);
        textAlign(CENTER, CENTER);

      case 1:
        textAlign(CENTER, CENTER);
        text(suggested_words[0], width / 2 - (3/2)*((4/3)*PPCM), height_words, (4/3)*PPCM);
        textAlign(CENTER, CENTER);

      default:
        break

    }
  }
}

// Receives and processes pressed suggested word
function wordPressed(word_number) {
  correct_word = suggested_words[word_number];
  let i;

  console.log("currently_typed.length = " + currently_typed.length);
  for (i = currently_typed.length - 1; currently_typed.charAt(i) != " "; i--)
    if (i == 0){
      currently_typed = "";
      break;
    }

  if (currently_typed != "")
    currently_typed = currently_typed.slice(0, i+1);
  currently_typed += correct_word + " ";
  current_word = "";
  autocomplete();
}

// Receives and processes pressed key
function buttonPressed(key) {
  time_press = millis();

  if (key == last_clicked && key != 0 && time_press - last_press < double_click_delay)
    incrementLastLetter();
  else if (key == 0) currently_typed = currently_typed.slice(0, -1);
  else if (key == 1) currently_typed += "a";
  else if (key == 2) currently_typed += "d";
  else if (key == 3) currently_typed += "g";
  else if (key == 4) currently_typed += "j";
  else if (key == 5) currently_typed += "m";
  else if (key == 6) currently_typed += "p";
  else if (key == 7) currently_typed += "t";
  else if (key == 8) currently_typed += "w";

  /* used for the autocomplete*/
  current_word = currently_typed.slice(currently_typed.lastIndexOf(" ") + 1);
  autocomplete();
  console.log(">" + current_word + "<");

  if (last_clicked == 0 && key == 0) last_clicked = "";
  else last_clicked = key;
  last_press = time_press;
}

// Changes string to match 2nd or 3rd consecutive click
function incrementLastLetter() {
  let last_char = currently_typed.slice(-1).charCodeAt(0);
  let new_char;

  switch (last_char) {
    case 32:
      new_char = "t";
      break;
    case 99:
      new_char = "a";
      break;
    case 102:
      new_char = "d";
      break;
    case 105:
      new_char = "g";
      break;
    case 108:
      new_char = "j";
      break;
    case 111:
      new_char = "m";
      break;
    case 115:
      new_char = "p";
      break;
    case 118:
      new_char = " ";
      break;
    case 122:
      new_char = "w";
      break;
    default:
      new_char = String.fromCharCode(last_char + 1);
  }
  currently_typed = currently_typed.replace(/.$/, new_char);
  return;
}


// Gets words that resemble the most the word that is being written
function autocomplete() {
  /* TODO: things that need to be done:
        1º: colocar a função no sitio em que alteramos a current_word ou no sitio que processamos o input do user
        2º: o output vem numa lista de 3 strings. este output deve ser renderizado para o user
        3º: também temos de fazer um botão/algum sitio em que o user possa selecionar qual a palavra que quer
   */
  $.ajax({
    type: "POST",
    url: autoCompleteWebServer,
    data: `${current_word}`,
    success: function (response) {
      suggested_words = response.replace(/'/g, "").split(",");
      console.log(suggested_words); // FIXME: remove this. is just used for reference and to see what is being passed
    },
    error: function (xhr, status) {
      console.log(status);
      console.log(xhr);
    },
  });
}

// Evoked when the mouse button was pressed
function mousePressed() {
  // Only look for mouse presses during the actual test
  if (draw_finger_arm) {
    // Check if mouse click happened within the touch input area
    if (
      mouseClickWithin(
        width / 2 - 2.0 * PPCM,
        height / 2 - 1.0 * PPCM,
        4.0 * PPCM,
        3.0 * PPCM
      )
    ) {
      // Check if mouse click was on left arrow (2D keyboard)
      //if (mouseClickWithin(width/2 - ARROW_SIZE, height/2, ARROW_SIZE, ARROW_SIZE))
      //{
      //current_letter = getPreviousChar(current_letter);
      //if (current_letter.charCodeAt(0) < '_'.charCodeAt(0)) current_letter = 'z';  // wrap around to z
      //}
      //// Check if mouse click was on right arrow (2D keyboard)
      //else if (mouseClickWithin(width/2, height/2, ARROW_SIZE, ARROW_SIZE))
      //{
      //current_letter = getNextChar(current_letter);
      //if (current_letter.charCodeAt(0) > 'z'.charCodeAt(0)) current_letter = '_'; // wrap back to space (i.e., the underscore)
      //}
      //else
      //{
      //// Click in whitespace indicates a character input (2D keyboard)
      //if (current_letter == '_') currently_typed += " ";                          // if underscore, consider that a space bar
      //else if (current_letter == '`' && currently_typed.length > 0)               // if `, treat that as delete
      //currently_typed = currently_typed.substring(0, currently_typed.length - 1);
      //else if (current_letter != '`') currently_typed += current_letter;          // if not any of the above cases, add the current letter to the entered phrase
      //}

      if (mouseClickWithin(BASE_WIDTH, BASE_HEIGHT, BT_WIDTH, BT_HEIGHT))
        buttonPressed(0);
      else if (
        mouseClickWithin(
          BASE_WIDTH + BT_WIDTH,
          BASE_HEIGHT,
          BT_WIDTH,
          BT_HEIGHT
        )
      )
        buttonPressed(1);
      else if (
        mouseClickWithin(
          BASE_WIDTH + 2 * BT_WIDTH,
          BASE_HEIGHT,
          BT_WIDTH,
          BT_HEIGHT
        )
      )
        buttonPressed(2);
      else if (
        mouseClickWithin(
          BASE_WIDTH,
          BASE_HEIGHT + BT_HEIGHT,
          BT_WIDTH,
          BT_HEIGHT
        )
      )
        buttonPressed(3);
      else if (
        mouseClickWithin(
          BASE_WIDTH + BT_WIDTH,
          BASE_HEIGHT + BT_HEIGHT,
          BT_WIDTH,
          BT_HEIGHT
        )
      )
        buttonPressed(4);
      else if (
        mouseClickWithin(
          BASE_WIDTH + 2 * BT_WIDTH,
          BASE_HEIGHT + BT_HEIGHT,
          BT_WIDTH,
          BT_HEIGHT
        )
      )
        buttonPressed(5);
      else if (
        mouseClickWithin(
          BASE_WIDTH,
          BASE_HEIGHT + 2 * BT_HEIGHT,
          BT_WIDTH,
          BT_HEIGHT
        )
      )
        buttonPressed(6);
      else if (
        mouseClickWithin(
          BASE_WIDTH + BT_WIDTH,
          BASE_HEIGHT + 2 * BT_HEIGHT,
          BT_WIDTH,
          BT_HEIGHT
        )
      )
        buttonPressed(7);
      else if (
        mouseClickWithin(
          BASE_WIDTH + 2 * BT_WIDTH,
          BASE_HEIGHT + 2 * BT_HEIGHT,
          BT_WIDTH,
          BT_HEIGHT
        )
      )
        buttonPressed(8);
      else if (
        mouseClickWithin(
          width / 2 - 2.0 * PPCM,
          height / 2 - 1.0 * PPCM,
          (4.0 * PPCM) / 3,
          0.592 * PPCM
        )
      )
        wordPressed(0);
      else if (
        mouseClickWithin(
          width / 2 - (2.0 * PPCM) / 3,
          height / 2 - 1.0 * PPCM,
          (4.0 * PPCM) / 3,
          0.592 * PPCM
        )
      )
        wordPressed(1);
      else if (
        mouseClickWithin(
          width / 2 + (2.0 * PPCM) / 3,
          height / 2 - 1.0 * PPCM,
          (4.0 * PPCM) / 3,
          0.592 * PPCM
        )
      )
        wordPressed(2);
    }

    // Check if mouse click happened within 'ACCEPT'
    // (i.e., submits a phrase and completes a trial)
    else if (
      mouseClickWithin(
        width / 2 - 2 * PPCM,
        height / 2 - 5.1 * PPCM,
        4.0 * PPCM,
        2.0 * PPCM
      )
    ) {
      // Saves metrics for the current trial
      letters_expected += target_phrase.trim().length;
      letters_entered += currently_typed.trim().length;
      errors += computeLevenshteinDistance(
        currently_typed.trim(),
        target_phrase.trim()
      );
      entered[current_trial] = currently_typed;
      trial_end_time = millis();

      current_trial++;

      // Check if the user has one more trial/phrase to go
      if (current_trial < 2) {
        // Prepares for new trial
        currently_typed = "";
        target_phrase = phrases[current_trial];
      } else {
        // The user has completed both phrases for one attempt
        draw_finger_arm = false;
        attempt_end_time = millis();

        printAndSavePerformance(); // prints the user's results on-screen and sends these to the DB
        attempt++;

        // Check if the user is about to start their second attempt
        if (attempt < 2) {
          second_attempt_button = createButton("START 2ND ATTEMPT");
          second_attempt_button.mouseReleased(startSecondAttempt);
          second_attempt_button.position(
            width / 2 - second_attempt_button.size().width / 2,
            height / 2 + 200
          );
        }
      }
    }
  }
}

// Resets variables for second attempt
function startSecondAttempt() {
  // Re-randomize the trial order (DO NOT CHANG THESE!)
  shuffle(phrases, true);
  current_trial = 0;
  target_phrase = phrases[current_trial];

  // Resets performance variables (DO NOT CHANG THESE!)
  letters_expected = 0;
  letters_entered = 0;
  errors = 0;
  currently_typed = "";
  CPS = 0;

  current_letter = "a";

  // Show the watch and keyboard again
  second_attempt_button.remove();
  draw_finger_arm = true;
  attempt_start_time = millis();
}

// Print and save results at the end of 2 trials
function printAndSavePerformance() {
  // DO NOT CHANGE THESE
  let attempt_duration = (attempt_end_time - attempt_start_time) / 60000; // 60K is number of milliseconds in minute
  let wpm = letters_entered / 5.0 / attempt_duration;
  let freebie_errors = letters_expected * 0.05; // no penalty if errors are under 5% of chars
  let penalty = max(0, (errors - freebie_errors) / attempt_duration);
  let wpm_w_penalty = max(wpm - penalty, 0); // minus because higher WPM is better: NET WPM
  let timestamp =
    day() +
    "/" +
    month() +
    "/" +
    year() +
    "  " +
    hour() +
    ":" +
    minute() +
    ":" +
    second();

  background(color(0, 0, 0)); // clears screen
  cursor(); // shows the cursor again

  textFont("Arial", 16); // sets the font to Arial size 16
  fill(color(255, 255, 255)); //set text fill color to white
  text(timestamp, 100, 20); // display time on screen

  text(
    "Finished attempt " + (attempt + 1) + " out of 2!",
    width / 2,
    height / 2
  );

  // For each trial/phrase
  let h = 20;
  for (i = 0; i < 2; i++, h += 40) {
    text(
      "Target phrase " + (i + 1) + ": " + phrases[i],
      width / 2,
      height / 2 + h
    );
    text(
      "User typed " + (i + 1) + ": " + entered[i],
      width / 2,
      height / 2 + h + 20
    );
  }

  text("Raw WPM: " + wpm.toFixed(2), width / 2, height / 2 + h + 20);
  text(
    "Freebie errors: " + freebie_errors.toFixed(2),
    width / 2,
    height / 2 + h + 40
  );
  text("Penalty: " + penalty.toFixed(2), width / 2, height / 2 + h + 60);
  text(
    "WPM with penalty: " + wpm_w_penalty.toFixed(2),
    width / 2,
    height / 2 + h + 80
  );

  // Saves results (DO NOT CHANGE!)
  let attempt_data = {
    project_from: GROUP_NUMBER,
    assessed_by: student_ID,
    attempt_completed_by: timestamp,
    attempt: attempt,
    attempt_duration: attempt_duration,
    raw_wpm: wpm,
    freebie_errors: freebie_errors,
    penalty: penalty,
    wpm_w_penalty: wpm_w_penalty,
    cps: CPS,
  };

  // Send data to DB (DO NOT CHANGE!)
  if (BAKE_OFF_DAY) {
    // Access the Firebase DB
    if (attempt === 0) {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
    }

    // Add user performance results
    let db_ref = database.ref("G" + GROUP_NUMBER);
    db_ref.push(attempt_data);
  }
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  let display = new Display({ diagonal: display_size }, window.screen);

  // DO NO CHANGE THESE!
  PPI = display.ppi; // calculates pixels per inch
  PPCM = PPI / 2.54; // calculates pixels per cm
  FINGER_SIZE = int(11 * PPCM);
  FINGER_OFFSET = int(0.8 * PPCM);
  ARM_LENGTH = int(19 * PPCM);
  ARM_HEIGHT = int(11.2 * PPCM);

  //ARROW_SIZE     = (int)(2.2  * PPCM);
  BASE_WIDTH = int(width / 2 - 2.0 * PPCM);
  BASE_HEIGHT = int(height / 2 - (1.0 - 0.592) * PPCM);
  BT_WIDTH = int(1.333 * PPCM);
  BT_HEIGHT = int(0.737 * PPCM);

  // Starts drawing the watch immediately after we go fullscreen (DO NO CHANGE THIS!)
  draw_finger_arm = true;
  attempt_start_time = millis();
}
