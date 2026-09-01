#include <Servo.h>

// --- Pin Definitions ---
const int SERVO_PIN = 11;
const int TRIG_PIN = 8;
const int ECHO_PIN = 9;

// --- Servo continuo / paso a paso sin feedback ---
// Rotación libre a velocidad constante. El ángulo se ESTIMA por tiempo.
const int SERVO_STOP = 90;    // Valor que detiene el servo continuo
const int SERVO_SPEED = 40;   // Valor de velocidad (0..90 hacia un lado, 90..180 al otro)
const bool SERVO_DIRECTION = true; // true = gira en sentido horario

// Tiempo que tarda en dar una vuelta completa (360°) a SERVO_SPEED.
// Calíbralo midiendo con un cronómetro y ajusta este valor.
const unsigned long TIME_FOR_360_MS = 4000;

// --- Ultrasonic ---
const float SOUND_SPEED_FACTOR = 58.2;
const long PULSE_TIMEOUT = 10000;       // 10ms => ~172cm max (us = microsegundos)
const int MAX_VALID_DISTANCE = 400;     // en cm, por encima de esto se marca como sin objeto

// --- Timing ---
const int MEASURE_INTERVAL_MS = 30;     // medición cada 30ms aprox
const float DEGREES_PER_MS = 360.0 / TIME_FOR_360_MS; // grados estimados por milisegundo

Servo myServo;

unsigned long lastAngleUpdate = 0;
float estimatedAngle = 0.0;   // 0..360 en grados

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  myServo.attach(SERVO_PIN);
  Serial.begin(9600);

  myServo.write(SERVO_STOP);
  delay(100);
}

void loop() {
  rotateServo();      // mantiene la rotación (posición derivada del tiempo)
  measureAndPrint();  // mide y envía la muestra
  delay(MEASURE_INTERVAL_MS);
}

/**
 * Actualiza el ángulo estimado según el tiempo transcurrido mientras
 * el motor gira a velocidad constante.
 */
void rotateServo() {
  unsigned long now = millis();
  unsigned long elapsed = now - lastAngleUpdate;
  lastAngleUpdate = now;

  // Especifica sentido de giro
  int dir = SERVO_DIRECTION ? 1 : -1;
  estimatedAngle += dir * (elapsed * DEGREES_PER_MS);
  estimatedAngle = fmod(estimatedAngle, 360.0);
  if (estimatedAngle < 0) estimatedAngle += 360.0;

  // Aplica velocidad de rotación
  myServo.write(SERVO_DIRECTION ? SERVO_SPEED : 180 - SERVO_SPEED);
}

/**
 * Mide la distancia y envía la muestra SIEMPRE, con un flag de detección.
 * Formato: {"angle":X,"distance":Y,"detected":0|1}
 */
void measureAndPrint() {
  long duration = readUltrasonic();
  int distance = duration > 0 ? static_cast<int>(duration / SOUND_SPEED_FACTOR) : -1;

  bool detected = (distance >= 0 && distance <= MAX_VALID_DISTANCE);
  int reportedDistance = detected ? distance : 0;

  Serial.print("{\"angle\":");
  Serial.print(estimatedAngle);
  Serial.print(",\"distance\":");
  Serial.print(reportedDistance);
  Serial.print(",\"detected\":");
  Serial.print(detected ? 1 : 0);
  Serial.println("}");
}

/**
 * Lee el pulso ultrasónico con timeout para no bloquear el barrido.
 * @return duración en microsegundos, o 0 si hubo timeout (sin eco).
 */
long readUltrasonic() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  return pulseIn(ECHO_PIN, HIGH, PULSE_TIMEOUT);
}
