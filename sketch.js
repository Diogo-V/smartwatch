// Bakeoff #3 - Escrita em Smartwatches
// IPM 2020-21, Semestre 2
// Entrega: até dia 4 de Junho às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 31 de Maio

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER   = 31;      // add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY   = false;  // set to 'true' before sharing during the simulation and bake-off days

let PPI, PPCM;                 // pixel density (DO NOT CHANGE!)
let second_attempt_button;     // button that starts the second attempt (DO NOT CHANGE!)

// Finger parameters (DO NOT CHANGE!)
let finger_img;                // holds our finger image that simules the 'fat finger' problem
let FINGER_SIZE, FINGER_OFFSET;// finger size and cursor offsett (calculated after entering fullscreen)

// Arm parameters (DO NOT CHANGE!)
let arm_img;                   // holds our arm/watch image
let ARM_LENGTH, ARM_HEIGHT;    // arm size and position (calculated after entering fullscreen)

// Study control parameters (DO NOT CHANGE!)
let draw_finger_arm  = false;  // used to control what to show in draw()
let phrases          = [];     // contains all 501 phrases that can be asked of the user
let current_trial    = 0;      // the current trial out of 2 phrases (indexes into phrases array above)
let attempt          = 0       // the current attempt out of 2 (to account for practice)
let target_phrase    = "";     // the current target phrase
let currently_typed  = "";     // what the user has typed so far
let entered          = new Array(2); // array to store the result of the two trials (i.e., the two phrases entered in one attempt)
let CPS              = 0;      // add the characters per second (CPS) here (once for every attempt)

// Metrics
let attempt_start_time, attempt_end_time; // attemps start and end times (includes both trials)
let trial_end_time;            // the timestamp of when the lastest trial was completed
let letters_entered  = 0;      // running number of letters entered (for final WPM computation)
let letters_expected = 0;      // running number of letters expected (from target phrase)
let errors           = 0;      // a running total of the number of errors (when hitting 'ACCEPT')
let database;                  // Firebase DB

// 2D Keyboard UI
let leftArrow, rightArrow;     // holds the left and right UI images for our basic 2D keyboard
let ARROW_SIZE;                // UI button size
let current_letter = 'a';      // current char being displayed on our basic 2D keyboard (starts with 'a')

//Our keyboard
let img_kb_MAIN;
let img_kb_ABC;
let img_kb_DEF;
let img_kb_GHI;
let img_kb_JKL;
let img_kb_MNO;
let img_kb_PQRS;
let img_kb_TUVW;
let img_kb_XYZ;

// Current state
let current_state = "main";
let BT_HEIGHT;
let BT_WIDTH_SHORT;
let BT_WIDTH_LONG;

// Runs once before the setup() and loads our data (images, phrases)
function preload()
{
  // Loads simulation images (arm, finger) -- DO NOT CHANGE!
  arm = loadImage("data/arm_watch.png");
  fingerOcclusion = loadImage("data/finger.png");

  // Loads the target phrases (DO NOT CHANGE!)
  phrases = loadStrings("data/phrases.txt");

  // Loads UI elements for our basic keyboard
  leftArrow = loadImage("data/left.png");
  rightArrow = loadImage("data/right.png");

  //Loads custom keyboards
  img_kb_MAIN = loadImage("keyboards/MainKeyboard.png");
  img_kb_ABC = loadImage("keyboards/AuxKeyboard3_ABC.png");
  img_kb_DEF = loadImage("keyboards/AuxKeyboard3_DEF.png");
  img_kb_GHI = loadImage("keyboards/AuxKeyboard3_GHI.png");
  img_kb_JKL = loadImage("keyboards/AuxKeyboard3_JKL.png");
  img_kb_MNO = loadImage("keyboards/AuxKeyboard3_MNO.png");
  img_kb_PQRS = loadImage("keyboards/AuxKeyboard4_PQRS.png");
  img_kb_TUVW = loadImage("keyboards/AuxKeyboard4_TUVW.png");
  img_kb_XYZ = loadImage("keyboards/AuxKeyboard3_XYZ.png");
}

// Runs once at the start
function setup()
{
  createCanvas(700, 500);   // window size in px before we go into fullScreen()
  frameRate(60);            // frame rate (DO NOT CHANGE!)

  // DO NOT CHANGE THESE!
  shuffle(phrases, true);   // randomize the order of the phrases list (N=501)
  target_phrase = phrases[current_trial];

  drawUserIDScreen();       // draws the user input screen (student number and display size)
}

function draw()
{
  if(draw_finger_arm)
  {
    background(255);           // clear background
    noCursor();                // hides the cursor to simulate the 'fat finger'

    drawArmAndWatch();         // draws arm and watch background
    writeTargetAndEntered();   // writes the target and entered phrases above the watch
    drawACCEPT();              // draws the 'ACCEPT' button that submits a phrase and completes a trial

    // Draws the non-interactive screen area (4x1cm) -- DO NOT CHANGE SIZE!
    noStroke();
    fill(125);
    rect(width/2 - 2.0*PPCM, height/2 - 2.0*PPCM, 4.0*PPCM, 1.0*PPCM);
    textAlign(CENTER);
    textFont("Arial", 16);
    fill(0);
    text("NOT INTERACTIVE", width/2, height/2 - 1.3 * PPCM);

    // Draws the touch input area (4x3cm) -- DO NOT CHANGE SIZE!
    stroke(0, 255, 0);
    noFill();
    rect(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM);

    draw2Dkeyboard();       // draws our basic 2D keyboard UI

    drawFatFinger();        // draws the finger that simulates the 'fat finger' problem
  }
}

// Draws 2D keyboard UI (current letter and left and right arrows)
function draw2Dkeyboard()
{
  ///Writes the current letter
  //textFont("Arial", 24);
  //fill(0);
  //text("" + current_letter, width/2, height/2);

  ///Draws and the left and right arrow buttons
  //noFill();
  //imageMode(CORNER);
  //image(leftArrow, width/2 - ARROW_SIZE, height/2, ARROW_SIZE, ARROW_SIZE);
  //image(rightArrow, width/2, height/2, ARROW_SIZE, ARROW_SIZE);

  imageMode(CENTER);

  if (current_state == "main")
    image(img_kb_MAIN, width / 2, height / 2 + 0.5 * PPCM, 4.0 * PPCM, 3.0 * PPCM);

  else if (current_state == "ABC")
    image(img_kb_ABC, width / 2, height / 2 + 0.5 * PPCM, 4.0 * PPCM, 3.0 * PPCM);

  else if (current_state == "DEF")
    image(img_kb_DEF, width / 2, height / 2 + 0.5 * PPCM, 4.0 * PPCM, 3.0 * PPCM);

  else if (current_state == "GHI")
    image(img_kb_GHI, width / 2, height / 2 + 0.5 * PPCM, 4.0 * PPCM, 3.0 * PPCM);

  else if (current_state == "JKL")
    image(img_kb_JKL, width / 2, height / 2 + 0.5 * PPCM, 4.0 * PPCM, 3.0 * PPCM);

  else if (current_state == "MNO")
    image(img_kb_MNO, width / 2, height / 2 + 0.5 * PPCM, 4.0 * PPCM, 3.0 * PPCM);

  else if (current_state == "PQRS")
    image(img_kb_PQRS, width / 2, height / 2 + 0.5 * PPCM, 4.0 * PPCM, 3.0 * PPCM);

  else if (current_state == "TUVW")
    image(img_kb_TUVW, width / 2, height / 2 + 0.5 * PPCM, 4.0 * PPCM, 3.0 * PPCM);

  else if (current_state == "XYZ")
    image(img_kb_XYZ, width / 2, height / 2 + 0.5 * PPCM, 4.0 * PPCM, 3.0 * PPCM);

}

// Evoked when the mouse button was pressed
function mousePressed()
{
  // Only look for mouse presses during the actual test
  if (draw_finger_arm)
  {
    // Check if mouse click happened within the touch input area
    if(mouseClickWithin(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM))
    {
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

      if (current_state == "main"){
        if (mouseClickWithin(width / 2 - 2.0 * PPCM, height / 2 - PPCM + BT_HEIGHT, BT_HEIGHT, BT_WIDTH_SHORT)){
          current_state = "ABC";
          console.log("State changed to ABC");
        }

        else if (mouseClickWithin(width / 2 - 2.0 * PPCM + BT_HEIGHT, height / 2 - PPCM, BT_WIDTH_LONG, BT_HEIGHT)){
          current_state = "DEF";
          console.log("State changed to DEF");
        }

        else if (mouseClickWithin(width / 2, height / 2 - PPCM, BT_WIDTH_LONG, BT_HEIGHT)){
          current_state = "GHI";
          console.log("State changed to GHI");
        }

        else if (mouseClickWithin(width / 2 + 2.0 * PPCM - BT_HEIGHT, height / 2 - PPCM + BT_HEIGHT, BT_HEIGHT, BT_WIDTH_SHORT)){
          current_state = "JKL";
          console.log("State changed to JKL");
        }

        else if (mouseClickWithin(width / 2 + 2.0 * PPCM - BT_HEIGHT, height / 2 + PPCM / 2, BT_HEIGHT, BT_WIDTH_SHORT)){
          current_state = "MNO";
          console.log("State changed to MNO");
        }

        else if (mouseClickWithin(width / 2, height / 2 + 2.0 * PPCM - BT_HEIGHT, BT_WIDTH_LONG, BT_HEIGHT)){
          current_state = "PQRS";
          console.log("State changed to PQRS");
        }

        else if (mouseClickWithin(width / 2 - 2.0 * PPCM + BT_HEIGHT, height / 2 + 2.0 * PPCM - BT_HEIGHT, BT_WIDTH_LONG, BT_HEIGHT)){
          current_state = "TUVW";
          console.log("State changed to TUVW");
        }

        else if (mouseClickWithin(width / 2 - 2.0 * PPCM, height / 2 + PPCM / 2, BT_HEIGHT, BT_WIDTH_SHORT)){
          current_state = "XYZ";
          console.log("State changed to XYZ");
        }

        else if(mouseClickWithin(width / 2 - 1.3* PPCM, height / 2 + 0.7*PPCM, BT_HEIGHT, BT_HEIGHT)){
          currently_typed += ' ';
        }

        else if(mouseClickWithin(width / 2 + PPCM/3, height / 2 + 0.7 *PPCM, BT_HEIGHT, BT_HEIGHT)){
          currently_typed = currently_typed.substring(0, currently_typed.length - 1);
        }
      }

      else if(current_state == "ABC"){
        if (mouseClickWithin(width / 2 - 2.0 * PPCM, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'a';
        }

        else if (mouseClickWithin(width / 2 - 2.0 * PPCM + BT_WIDTH_LONG, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'b';
        }

        else if (mouseClickWithin(width / 2 - 2.0 * PPCM + 2*BT_WIDTH_LONG, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'c';
        }

        current_state = "main";
      }

      else if(current_state == "DEF"){
        if (mouseClickWithin(width / 2 - 2.0 * PPCM, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'd';
          current_state = "main";
        }

        else if (mouseClickWithin(width / 2 - 2.0 * PPCM + BT_WIDTH_LONG, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'e';
          current_state = "main";
        }

        else if (mouseClickWithin(width / 2 - 2.0 * PPCM + 2*BT_WIDTH_LONG, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'f';
          current_state = "main";
        }

        else{
        current_state = "main";
        }
      }

      else if(current_state == "GHI"){
        if (mouseClickWithin(width / 2 - 2.0 * PPCM, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'g';
          current_state = "main";
        }

        else if (mouseClickWithin(width / 2 - 2.0 * PPCM + BT_WIDTH_LONG, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'h';
          current_state = "main";
        }

        else if (mouseClickWithin(width / 2 - 2.0 * PPCM + 2*BT_WIDTH_LONG, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'i';
          current_state = "main";
        }

        else{
          current_state = "main";
        }
      }

      else if(current_state == "JKL"){
        if (mouseClickWithin(width / 2 - 2.0 * PPCM, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'j';
          current_state = "main";
        }

        else if (mouseClickWithin(width / 2 - 2.0 * PPCM + BT_WIDTH_LONG, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'k';
          current_state = "main";
        }

        else if (mouseClickWithin(width / 2 - 2.0 * PPCM + 2*BT_WIDTH_LONG, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'l';
          current_state = "main";
        }

        else{
          current_state = "main";
        }
      }

      else if(current_state == "MNO"){
        if (mouseClickWithin(width / 2 - 2.0 * PPCM, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'm';
          current_state = "main";
        }

        else if (mouseClickWithin(width / 2 - 2.0 * PPCM + BT_WIDTH_LONG, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'n';
          current_state = "main";
        }

        else if (mouseClickWithin(width / 2 - 2.0 * PPCM + 2*BT_WIDTH_LONG, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'o';
          current_state = "main";
        }

        else{
          current_state = "main";
        }
      }

      else if(current_state == "PQRS"){
        if (mouseClickWithin(width / 2 - 2.5 * PPCM, height / 2 - 2 * PPCM, BT_WIDTH_LONG + BT_WIDTH_LONG/2, 2.5 * PPCM)) {
          currently_typed += "p";
          current_state = "main";
        } 

        else if (mouseClickWithin(width / 2, height / 2 - 2 * PPCM, BT_WIDTH_LONG + BT_WIDTH_LONG/2, 2.5 * PPCM)) {
          currently_typed += "q";
          current_state = "main";
        } 

        else if (mouseClickWithin(width / 2 - 2.5 * PPCM, height / 2, BT_WIDTH_LONG + BT_WIDTH_LONG/2, 2.5 * PPCM)) {
          currently_typed += "r";
          current_state = "main";
        } 

        else if (mouseClickWithin(width / 2, height / 2, BT_WIDTH_LONG + BT_WIDTH_LONG/2, 2.5 * PPCM)) {
          currently_typed += "s";
          current_state = "main";
        } 

        else {
          current_state = "main";
        }
      }

      else if(current_state == "TUVW"){
        if (mouseClickWithin(width / 2 - 2.5 * PPCM, height / 2 - 2 * PPCM, BT_WIDTH_LONG + BT_WIDTH_LONG/2, 2.5 * PPCM)) {
          currently_typed += "t";
          current_state = "main";
        } 

        else if (mouseClickWithin(width / 2, height / 2 - 2 * PPCM, BT_WIDTH_LONG + BT_WIDTH_LONG/2, 2.5 * PPCM)) {
          currently_typed += "u";
          current_state = "main";
        } 

        else if (mouseClickWithin(width / 2 - 2.5 * PPCM, height / 2, BT_WIDTH_LONG + BT_WIDTH_LONG/2, 2.5 * PPCM)) {
          currently_typed += "v";
          current_state = "main";
        } 

        else if (mouseClickWithin(width / 2, height / 2, BT_WIDTH_LONG + BT_WIDTH_LONG/2, 2.5 * PPCM)) {
          currently_typed += "w";
          current_state = "main";
        } 

        else{
          current_state = "main";
        }
      }

      else if(current_state == "XYZ"){
        if (mouseClickWithin(width / 2 - 2.0 * PPCM, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'x';
          current_state = "main";
        }
        else if (mouseClickWithin(width / 2 - 2.0 * PPCM + BT_WIDTH_LONG, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'y';
          current_state = "main";
        }

        else if (mouseClickWithin(width / 2 - 2.0 * PPCM + 2*BT_WIDTH_LONG, height / 2 - 0.5 * PPCM, BT_WIDTH_LONG, 3.0 * PPCM)){
          currently_typed += 'z';
          current_state = "main";
        }

        else{
          current_state = "main";
        }
      }

      else
        current_state = "main";
        console.log("Main"); //DEBUG

    }

    // Check if mouse click happened within 'ACCEPT'
    // (i.e., submits a phrase and completes a trial)
    else if (mouseClickWithin(width/2 - 2*PPCM, height/2 - 5.1*PPCM, 4.0*PPCM, 2.0*PPCM))
    {
      // Saves metrics for the current trial
      letters_expected += target_phrase.trim().length;
      letters_entered += currently_typed.trim().length;
      errors += computeLevenshteinDistance(currently_typed.trim(), target_phrase.trim());
      entered[current_trial] = currently_typed;
      trial_end_time = millis();

      current_trial++;

      // Check if the user has one more trial/phrase to go
      if (current_trial < 2)
      {
        // Prepares for new trial
        currently_typed = "";
        target_phrase = phrases[current_trial];
      }
      else
      {
        // The user has completed both phrases for one attempt
        draw_finger_arm = false;
        attempt_end_time = millis();

        printAndSavePerformance();        // prints the user's results on-screen and sends these to the DB
        attempt++;

        // Check if the user is about to start their second attempt
        if (attempt < 2)
        {
          second_attempt_button = createButton('START 2ND ATTEMPT');
          second_attempt_button.mouseReleased(startSecondAttempt);
          second_attempt_button.position(width/2 - second_attempt_button.size().width/2, height/2 + 200);
        }
      }
    }
  }
}

// Resets variables for second attempt
function startSecondAttempt()
{
  // Re-randomize the trial order (DO NOT CHANG THESE!)
  shuffle(phrases, true);
  current_trial        = 0;
  target_phrase        = phrases[current_trial];

  // Resets performance variables (DO NOT CHANG THESE!)
  letters_expected     = 0;
  letters_entered      = 0;
  errors               = 0;
  currently_typed      = "";
  CPS                  = 0;

  current_letter       = 'a';

  // Show the watch and keyboard again
  second_attempt_button.remove();
  draw_finger_arm      = true;
  attempt_start_time   = millis();
}

// Print and save results at the end of 2 trials
function printAndSavePerformance()
{
  // DO NOT CHANGE THESE
  let attempt_duration = (attempt_end_time - attempt_start_time) / 60000;          // 60K is number of milliseconds in minute
  let wpm              = (letters_entered / 5.0) / attempt_duration;
  let freebie_errors   = letters_expected * 0.05;                                  // no penalty if errors are under 5% of chars
  let penalty          = max(0, (errors - freebie_errors) / attempt_duration);
  let wpm_w_penalty    = max((wpm - penalty),0);                                   // minus because higher WPM is better: NET WPM
  let timestamp        = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();

  background(color(0,0,0));    // clears screen
  cursor();                    // shows the cursor again

  textFont("Arial", 16);       // sets the font to Arial size 16
  fill(color(255,255,255));    //set text fill color to white
  text(timestamp, 100, 20);    // display time on screen

  text("Finished attempt " + (attempt + 1) + " out of 2!", width / 2, height / 2);

  // For each trial/phrase
  let h = 20;
  for(i = 0; i < 2; i++, h += 40 )
  {
    text("Target phrase " + (i+1) + ": " + phrases[i], width / 2, height / 2 + h);
    text("User typed " + (i+1) + ": " + entered[i], width / 2, height / 2 + h+20);
  }

  text("Raw WPM: " + wpm.toFixed(2), width / 2, height / 2 + h+20);
  text("Freebie errors: " + freebie_errors.toFixed(2), width / 2, height / 2 + h+40);
  text("Penalty: " + penalty.toFixed(2), width / 2, height / 2 + h+60);
  text("WPM with penalty: " + wpm_w_penalty.toFixed(2), width / 2, height / 2 + h+80);

  // Saves results (DO NOT CHANGE!)
  let attempt_data =
  {
        project_from:         GROUP_NUMBER,
        assessed_by:          student_ID,
        attempt_completed_by: timestamp,
        attempt:              attempt,
        attempt_duration:     attempt_duration,
        raw_wpm:              wpm,
        freebie_errors:       freebie_errors,
        penalty:              penalty,
        wpm_w_penalty:        wpm_w_penalty,
        cps:                  CPS
  }

  // Send data to DB (DO NOT CHANGE!)
  if (BAKE_OFF_DAY)
  {
    // Access the Firebase DB
    if (attempt === 0)
    {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
    }

    // Add user performance results
    let db_ref = database.ref('G' + GROUP_NUMBER);
    db_ref.push(attempt_data);
  }
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized()
{
  resizeCanvas(windowWidth, windowHeight);
  let display    = new Display({ diagonal: display_size }, window.screen);

  // DO NO CHANGE THESE!
  PPI           = display.ppi;                        // calculates pixels per inch
  PPCM          = PPI / 2.54;                         // calculates pixels per cm
  FINGER_SIZE   = (int)(11   * PPCM);
  FINGER_OFFSET = (int)(0.8  * PPCM)
  ARM_LENGTH    = (int)(19   * PPCM);
  ARM_HEIGHT    = (int)(11.2 * PPCM);

  //ARROW_SIZE     = (int)(2.2  * PPCM);
  BT_HEIGHT      = (int)(0.72 * PPCM);
  BT_WIDTH_SHORT = (int)(0.78 * PPCM);
  BT_WIDTH_LONG  = (int)(1.26 * PPCM);

  // Starts drawing the watch immediately after we go fullscreen (DO NO CHANGE THIS!)
  draw_finger_arm = true;
  attempt_start_time = millis();
}
