#include <Servo.h>

// --- SERVO DIAGNOSTICO v2 ---
// Tu resultado anterior ("se detiene pero da vueltas de mas") apunta a que el
// servo ES de ROTACION CONTINUA de 360° (tipo FS90R / MG996R modificado, le
// quitaron los topes internos). En esos servos write() controla VELOCIDAD:
//   90 = detenido, 0 = gira rapido en un sentido, 180 = gira rapido al otro.
//
// Esta prueba lo confirma definitivamente midiendo DIRECCION y VELOCIDAD:
//  - write(45)  -> si es continuo, girará DESPACIO en un sentido
//  - write(135) -> si es continuo, girará DESPACIO en el sentido opuesto
//  - write(0)   -> girará RAPIDO
//  - write(180) -> girará RAPIDO al otro lado
// En un servo ESTANDAR, 45/135/0/180 solo son posiciones (se detienen al llegar).

const int SERVO_PIN = 11;
Servo myServo;

void setup() {
  Serial.begin(9600);
  myServo.attach(SERVO_PIN);
  myServo.write(90); // detenerse (en continuo) o centro (en estandar)
  Serial.println("=== TEST SERVO v2 ===");
  Serial.println("Observa la VELOCIDAD de giro en cada paso:");
  Serial.println("  estandar  -> llega a una posicion y para");
  Serial.println("  continuo  -> gira a velocidad constante segun el valor");
  Serial.println("");
  delay(2000);
}

void loop() {
  test(45,  "write(45)  -> lento, un sentido");
  test(135, "write(135) -> lento, sentido opuesto");
  test(0,   "write(0)   -> RAPIDO");
  test(180, "write(180) -> RAPIDO opuesto");
  test(90,  "write(90)  -> se detiene");
}

void test(int angle, const char *message) {
  myServo.write(angle);
  Serial.println(message);
  delay(2500);
}
