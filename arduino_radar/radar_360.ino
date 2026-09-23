#include <Servo.h>

// --- Pin Definitions ---
const int SERVO_PIN = 11;
const int TRIG_PIN = 8;
const int ECHO_PIN = 9;

// ============================================================================
//  SERVO DE ROTACIÓN CONTINUA 360° (sin encoder)
//  El ángulo se SIMULA por TIEMPO. El motor gira despacio y cronometramos
//  cuánto tarda en dar una vuelta; con eso barrimos 0..360 y volvemos a 0.
// ============================================================================

// Velocidades del servo continuo:
//   90 = DETENIDO
//   <90 (45, 60...) = gira en UN sentido  (cuanto más cerca de 0, más rápido)
//   >90 (135, 120...) = gira en el OTRO   (cuanto más cerca de 180, más rápido)
// Usamos valores CERCANOS a 90 para que gire LENTO y sea controlable.
const int SERVO_CW = 70;     // un sentido (lento pero estable)
const int SERVO_CCW = 110;   // sentido opuesto (lento pero estable)
const int SERVO_STOP = 90;

// --- CALIBRACIÓN (IMPORTANTÍSIMO) ---
// Tiempo real en ms que el servo tarda en dar EXACTAMENTE UNA vuelta (360°)
// girando a la velocidad de SERVO_CW. MÍDELO con cronómetro:
//   1. Sube este código con TRIG/ECHO desconectados (o el servo solo).
//   2. Pon SERVO_TUNING_MODE = true (abajo) para que gire continuamente.
//   3. Cronometra 10 vueltas y divide entre 10 -> ese es el valor.
//   4. Escríbelo aquí y pon SERVO_TUNING_MODE = false.
const unsigned long TIME_FOR_360_MS = 1200; // <- AJUSTAR tras calibrar

// Modo de calibración: true = el servo gira SIN parar (para cronometrar vueltas).
const bool SERVO_TUNING_MODE = false;

// Barrido simulado de 0 a 360 y de 360 a 0
const float SWEEP_END_DEG = 360.0;

// --- Timing de medición ---
const int MEASURE_INTERVAL_MS = 30;   // medición cada 30ms aprox
const float DEGREES_PER_MS = 360.0 / TIME_FOR_360_MS;

// --- Ultrasonic ---
const float SOUND_SPEED_FACTOR = 58.2;
const long PULSE_TIMEOUT = 10000;
const int MAX_VALID_DISTANCE = 400;

Servo myServo;

int sweepDirection = 1;               // 1 = subiendo, -1 = bajando
float estimatedAngle = 0.0;           // 0..360
unsigned long lastMeasure = 0;
unsigned long lastUpdate = 0;

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  myServo.attach(SERVO_PIN);
  Serial.begin(9600);

  if (SERVO_TUNING_MODE) {
    // Calibración: gira lento sin parar en un sentido
    myServo.write(SERVO_CW);
    Serial.println("MODE DE CALIBRACION: cronometra 10 vueltas y divide entre 10.");
    return; // no hacemos barrido
  }

  myServo.write(SERVO_STOP);
  delay(100);
  lastUpdate = millis();
  lastMeasure = millis();
  estimatedAngle = 0.0;
}

void loop() {
  if (SERVO_TUNING_MODE) {
    return; // en calibración no hacemos nada más
  }

  rotateByTime();       // actualiza ángulo y dirección del servo
  maybeMeasure();       // mide a intervalos y envía muestra
}

/**
 * Barrido 0..360 -> 360..0 simulado por tiempo.
 * El motor gira en un sentido durante el tiempo estimado para 360°, luego
 * invierte y gira el mismo tiempo. El ángulo sigue una onda triangular.
 */
void rotateByTime() {
  unsigned long now = millis();
  unsigned long elapsed = now - lastUpdate;
  lastUpdate = now;

  estimatedAngle += sweepDirection * (elapsed * DEGREES_PER_MS);

  if (sweepDirection > 0 && estimatedAngle >= SWEEP_END_DEG) {
    estimatedAngle = SWEEP_END_DEG;
    sweepDirection = -1;      // invertir en la cima (360°)
  } else if (sweepDirection < 0 && estimatedAngle <= 0.0) {
    estimatedAngle = 0.0;
    sweepDirection = 1;       // invertir en el valle (0°)
  }

  myServo.write(sweepDirection > 0 ? SERVO_CW : SERVO_CCW);
}

/**
 * Mide y envía una muestra a intervalos, con el ángulo simulado actual.
 */
void maybeMeasure() {
  unsigned long now = millis();
  if (now - lastMeasure < MEASURE_INTERVAL_MS) return;
  lastMeasure = now;

  long duration = readUltrasonic();
  int distance = duration > 0 ? static_cast<int>(duration / SOUND_SPEED_FACTOR) : -1;

  bool detected = (distance >= 0 && distance <= MAX_VALID_DISTANCE);
  int reportedDistance = detected ? distance : 0;

  Serial.print("{\"angle\":");
  Serial.print(estimatedAngle, 1);
  Serial.print(",\"distance\":");
  Serial.print(reportedDistance);
  Serial.print(",\"detected\":");
  Serial.print(detected ? 1 : 0);
  Serial.println("}");
}

long readUltrasonic() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  return pulseIn(ECHO_PIN, HIGH, PULSE_TIMEOUT);
}
