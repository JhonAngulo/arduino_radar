/* Copyright (c) 2026 micro_radar.
 *
 * Scanning radar (180°) based on a standard servo and an HC-SR04
 * ultrasonic sensor. Each sweep moves the servo from 0° to 180° and back, measuring the
 * distance at every degree and streaming each reading as a JSON object over
 * the serial port:
 *
 *   {"angle": <deg>, "distance": <cm | -1>, "detected": <bool>}
 *
 * The paired web app (Web Serial API) parses these lines to draw the plot.
 */

#include <Arduino_JSON.h>
#include <Servo.h>

// ---------------------------------------------------------------------------
// Pin assignments
// ---------------------------------------------------------------------------
constexpr int SERVO_PIN = 9;
constexpr int TRIG_PIN  = 10;
constexpr int ECHO_PIN  = 11;

// ---------------------------------------------------------------------------
// Servo sweep configuration
// ---------------------------------------------------------------------------
constexpr int   SERVO_MIN_ANGLE         = 0;
constexpr int   SERVO_MAX_ANGLE         = 180;
constexpr int   DELAY_TURN_MS           = 100; // pause between steps of the sweep
constexpr int   SWEEP_PAUSE_MS          = 500; // pause at the ends of each sweep
constexpr unsigned long SERVO_HOME_DELAY_MS = 1000; // settle time after homing

// ---------------------------------------------------------------------------
// Ultrasonic sensor configuration
// ---------------------------------------------------------------------------
constexpr int  MAX_VALID_DISTANCE_CM = 40;  // readings above this are discarded
constexpr long PULSE_TIMEOUT_US      = 26000; // ~442 cm, max measurable distance

// ---------------------------------------------------------------------------
// Serial protocol
// ---------------------------------------------------------------------------
constexpr long SERIAL_BAUD_RATE      = 9600;

// ---------------------------------------------------------------------------
// Other
// ---------------------------------------------------------------------------
constexpr int NO_OBJECT_DISTANCE = -1; // sentinel for "no valid echo"


Servo radarServo;

bool stopSweep = false; // set to true to halt the sweeping loop

// Function prototypes
void goToHomePosition();
int  readDistance();
void sendReading(int angleDeg, int distanceCm);

/**
 * Initializes the sensor pins and the servo, then moves it to the home
 * position (0°). Waits briefly so the servo is settled before the first sweep.
 */
void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  Serial.begin(SERIAL_BAUD_RATE);
  radarServo.attach(SERVO_PIN);
  goToHomePosition();
  delay(SERVO_HOME_DELAY_MS);
}

/**
 * Sweeps the servo from 0° to 180° and back, measuring and reporting the
 * distance at every degree. Returns early while stopSweep is enabled.
 */
void loop() {
  if (stopSweep) {
    return;
  }

  // Forward sweep: 0° -> 180°
  for (int angle = SERVO_MIN_ANGLE; angle <= SERVO_MAX_ANGLE; angle++) {
    radarServo.write(angle);
    delay(DELAY_TURN_MS);

    sendReading(angle, readDistance());
  }

  delay(SWEEP_PAUSE_MS);

  // Backward sweep: 180° -> 0°
  for (int angle = SERVO_MAX_ANGLE; angle >= SERVO_MIN_ANGLE; angle--) {
    radarServo.write(angle);
    delay(DELAY_TURN_MS);

    sendReading(angle, readDistance());
  }

  delay(SWEEP_PAUSE_MS);
}

/**
 * Slows the servo down from its current position to 0° one degree at a time.
 * Guarantees that a sweep always starts from the home position.
 */
void goToHomePosition() {
  int currentAngle = radarServo.read();

  Serial.print("Initial angle: ");
  Serial.println(currentAngle);

  for (int angle = currentAngle; angle >= SERVO_MIN_ANGLE; angle--) {
    radarServo.write(angle);
    delay(DELAY_TURN_MS);
  }

  radarServo.write(SERVO_MIN_ANGLE);
}

/**
 * Triggers an ultrasonic pulse and measures how long the echo takes to return.
 *
 * @return  distance in centimeters, or NO_OBJECT_DISTANCE when the echo times
 *          out (no object within range).
 */
int readDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, PULSE_TIMEOUT_US);
  int distance = duration * 0.034 / 2;

  return (distance == 0) ? NO_OBJECT_DISTANCE : distance;
}

/**
 * Streams a single radar reading as a JSON object over the serial port, using
 * the contract expected by the frontend parser (src/serial/parser.ts).
 *
 * @param angleDeg    sweep angle in degrees (0-180).
 * @param distanceCm  measured distance, or NO_OBJECT_DISTANCE when out of range.
 */
void sendReading(int angleDeg, int distanceCm) {
  JSONVar doc;

  doc["angle"] = angleDeg;
  doc["distance"] = distanceCm;
  doc["detected"] = (distanceCm > 0 && distanceCm <= MAX_VALID_DISTANCE_CM);

  Serial.println(JSON.stringify(doc));
}