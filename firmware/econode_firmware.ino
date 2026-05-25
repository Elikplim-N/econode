#include <Adafruit_GFX.h>
#include <Adafruit_NeoPixel.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <RTClib.h>
#include <WiFi.h>
#include <Wire.h>
#include <time.h>

// ==========================================
// WIFI, NTP & SUPABASE CONFIGURATIONS
// ==========================================
const char *ssid = "EEnL";
const char *password = ".V@lidStudentQ";

const char *ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;
const int daylightOffset_sec = 0;

const char *supabase_url = "https://lhyxuuomjusjmkycuwuh.supabase.co/rest/v1";
const char *supabase_key =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoeXh1dW9tanVzam1reWN1d3VoIiwicm9sZSI6Im"
    "Fub24iLCJpYXQiOjE3NDEwODc0NjIsImV4cCI6MjA1NjY2MzQ2Mn0.d_Ax_9uf6_"
    "yrx6lpwFzptpyL3AfB_VPo-sXEgavje54";

// ==========================================
// PIN DEFINITIONS & CONFIGURATIONS
// ==========================================
#define PIR_PIN 13
#define DHT_PIN 14
#define LDR_PIN 34
#define MOTOR_ENA 33
#define MOTOR_IN1 26
#define MOTOR_IN2 25
#define LED_PIN 27

#define LDR_DARK_THRESHOLD 1500
#define MOTOR_PWM_FREQ 5000
#define MOTOR_PWM_RES 8
#define MOTOR_DEFAULT_SPEED 200
#define DHTTYPE DHT11
#define NUM_LEDS 1
#define TEMP_THRESHOLD 28.0
#define HUMIDITY_THRESHOLD 65.0

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

// ==========================================
// GLOBAL OBJECTS & VARIABLES
// ==========================================
DHT dht(DHT_PIN, DHTTYPE);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
RTC_DS3231 rtc;
Adafruit_NeoPixel pixels(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

// Shared state variables
float currentTemp = 0.0;
float currentHum = 0.0;
int ldrRaw = 0;
bool isDark = false;
bool fanRunning = false;
bool motionDetected = false;
bool lightOn = false;

// Cloud synced variables
bool cloudModeManual = false;
bool cloudFanOverride = false;
bool cloudLightOverride = false;
bool cloudSyncActive = false;
int cloudMotorSpeed = MOTOR_DEFAULT_SPEED;

// Timing Variables (Stopwatches)
unsigned long previousMotionMillis = 0;
unsigned long previousDisplayMillis = 0;
unsigned long previousSensorMillis = 0;
unsigned long previousCloudMillis = 0;

// State tracking for serial prints
bool lastMotion = false;
bool lastLight = false;

// ==========================================
// SETUP
// ==========================================
void setup() {
  Serial.begin(115200);

  // Wait for serial connection to stabilize
  while (!Serial) {
    delay(10);
  }
  delay(2000); // 2-second buffer for the IDE Serial Monitor to render

  Serial.println("\n--- EcoNode System Starting (Standard Loop) ---");

  // Hardware Init
  pinMode(PIR_PIN, INPUT);
  pinMode(MOTOR_IN1, OUTPUT);
  pinMode(MOTOR_IN2, OUTPUT);
  digitalWrite(MOTOR_IN1, LOW);
  digitalWrite(MOTOR_IN2, LOW);

  ledcAttach(MOTOR_ENA, MOTOR_PWM_FREQ, MOTOR_PWM_RES);
  ledcWrite(MOTOR_ENA, 0);

  pixels.begin();
  pixels.setBrightness(150);
  pixels.clear();
  pixels.show();
  delay(50); // Buffer for NeoPixels

  Wire.begin();
  delay(100); // Buffer to let the I2C bus stabilize before attaching devices

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 failed"));
    for (;;)
      ;
  }
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  delay(50); // Buffer after display init

  if (!rtc.begin()) {
    Serial.println("RTC failed");
    while (1)
      ;
  }
  delay(50); // Buffer after RTC init

  dht.begin();
  delay(500); // DHT sensors are notoriously slow. Give it half a second to wake
              // up.

  // Initial Wi-Fi & NTP Setup
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi Connected!");
  delay(100); // Buffer before starting network time requests

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  struct tm timeinfo;
  Serial.println("Syncing RTC with NTP server...");
  delay(500); // Give the ESP32 a moment to reach out to the NTP servers

  if (getLocalTime(&timeinfo, 10000)) {
    rtc.adjust(DateTime(timeinfo.tm_year + 1900, timeinfo.tm_mon + 1,
                        timeinfo.tm_mday, timeinfo.tm_hour, timeinfo.tm_min,
                        timeinfo.tm_sec));
    Serial.println("RTC successfully synced!");
  } else {
    Serial.println("Failed to obtain internet time.");
  }

  Serial.println("Setup Complete. Entering Main Loop.");
  delay(500); // One final breath before dropping into the high-speed loop
}

// ==========================================
// MAIN LOOP
// ==========================================
void loop() {
  unsigned long currentMillis = millis(); // Get the current time

  // ---------------------------------------------------------
  // 1. MOTION & LED (Runs every 100ms)
  // ---------------------------------------------------------
  if (currentMillis - previousMotionMillis >= 100) {
    previousMotionMillis = currentMillis;

    motionDetected = digitalRead(PIR_PIN);

    if (cloudModeManual) {
      lightOn = cloudLightOverride;
    } else {
      lightOn = motionDetected;
    }

    if (lightOn) {
      pixels.setPixelColor(0, pixels.Color(255, 200, 100));
    } else {
      pixels.setPixelColor(0, pixels.Color(0, 0, 0));
    }
    pixels.show();

    if (motionDetected != lastMotion || lightOn != lastLight) {
      Serial.print("[Motion] PIR: ");
      Serial.print(motionDetected ? "DETECTED" : "CLEAR");
      Serial.print(" | NeoPixel: ");
      Serial.println(lightOn ? "ON" : "OFF");
      lastMotion = motionDetected;
      lastLight = lightOn;
    }
  }

  // ---------------------------------------------------------
  // 2. DISPLAY (Runs every 1000ms)
  // ---------------------------------------------------------
  if (currentMillis - previousDisplayMillis >= 1000) {
    previousDisplayMillis = currentMillis;

    DateTime now = rtc.now();
    display.clearDisplay();

    display.setTextSize(1);
    display.setCursor(0, 0);
    display.printf("%02d:%02d", now.hour(), now.minute());

    display.setCursor(55, 0);
    if (cloudSyncActive) {
      display.print("SYNC OK");
    } else {
      display.print("NO SYNC");
    }

    display.drawLine(0, 10, 128, 10, SSD1306_WHITE);

    display.setTextSize(2);
    display.setCursor(0, 16);
    display.print("Tmp:");
    display.print((int)currentTemp);
    display.print("C");

    display.setCursor(0, 36);
    display.print("Hum:");
    display.print((int)currentHum);
    display.print("%");

    display.drawLine(0, 53, 128, 53, SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(0, 56);

    display.print(cloudModeManual ? "M:" : "A:");
    display.print(fanRunning ? "FAN" : "OFF");
    display.setCursor(55, 56);
    display.print(isDark ? "DARK" : "BRGT");
    display.setCursor(95, 56);
    display.print(motionDetected ? "OCC" : "MTY");

    display.display();
  }

  // ---------------------------------------------------------
  // 3. SENSORS & FAN (Runs every 2000ms)
  // ---------------------------------------------------------
  if (currentMillis - previousSensorMillis >= 2000) {
    previousSensorMillis = currentMillis;

    ldrRaw = analogRead(LDR_PIN);
    isDark = (ldrRaw > LDR_DARK_THRESHOLD);

    float t = dht.readTemperature();
    float h = dht.readHumidity();

    if (!isnan(t) && !isnan(h)) {
      currentTemp = t;
      currentHum = h;

      if (cloudModeManual) {
        fanRunning = cloudFanOverride;
      } else {
        fanRunning =
            (currentTemp >= TEMP_THRESHOLD || currentHum >= HUMIDITY_THRESHOLD);
      }

      if (fanRunning) {
        digitalWrite(MOTOR_IN1, HIGH);
        digitalWrite(MOTOR_IN2, LOW);
        ledcWrite(MOTOR_ENA, (uint8_t)cloudMotorSpeed);
      } else {
        digitalWrite(MOTOR_IN1, LOW);
        digitalWrite(MOTOR_IN2, LOW);
        ledcWrite(MOTOR_ENA, 0);
      }

      Serial.printf("[Sensors] Temp: %.1f C | Hum: %.1f %% | LDR: %d (%s) | "
                    "Fan: %s (Spd: %d)\n",
                    currentTemp, currentHum, ldrRaw, isDark ? "DARK" : "BRIGHT",
                    fanRunning ? "ON" : "OFF",
                    fanRunning ? cloudMotorSpeed : 0);
    } else {
      Serial.println("[Sensors] WARNING: Failed to read from DHT sensor!");
    }
  }

  // ---------------------------------------------------------
  // 4. CLOUD SYNC (Runs every 3000ms)
  // ---------------------------------------------------------
  if (currentMillis - previousCloudMillis >= 3000) {
    previousCloudMillis = currentMillis;

    if (WiFi.status() == WL_CONNECTED) {
      cloudSyncActive = true;
      HTTPClient http;

      // GET Settings
      String settingsUrl =
          String(supabase_url) + "/econode_device_settings?id=eq.1&select=*";
      http.begin(settingsUrl);
      http.addHeader("apikey", supabase_key);
      http.addHeader("Authorization", String("Bearer ") + String(supabase_key));

      int getHttpCode = http.GET();
      if (getHttpCode > 0) {
        String payload = http.getString(); // MUST read string before http.end()
        StaticJsonDocument<512> doc;
        DeserializationError err = deserializeJson(doc, payload);
        if (!err && doc.size() > 0) {
          JsonObject row = doc[0];
          cloudModeManual    = (row["mode"].as<String>() == "MANUAL");
          cloudFanOverride   = row["fan_override"].as<bool>();
          cloudLightOverride = row["light_override"].as<bool>();
          cloudMotorSpeed =
              constrain(row["motor_speed"] | MOTOR_DEFAULT_SPEED, 0, 255);

          // Print what we received so we can verify in Serial Monitor
          Serial.printf("[Cloud] Settings received → mode=%s | fan_ovr=%s | light_ovr=%s | speed=%d\n",
                        cloudModeManual    ? "MANUAL" : "AUTO",
                        cloudFanOverride   ? "true"   : "false",
                        cloudLightOverride ? "true"   : "false",
                        cloudMotorSpeed);
        } else {
          Serial.printf("[Cloud] GET parse error or empty row. HTTP=%d  raw=%s\n",
                        getHttpCode, payload.c_str());
        }
      } else {
        Serial.printf("[Cloud] GET failed HTTP=%d\n", getHttpCode);
      }
      http.end();

      // POST Telemetry
      String telemetryUrl = String(supabase_url) + "/econode_telemetry";
      http.begin(telemetryUrl);
      http.addHeader("apikey", supabase_key);
      http.addHeader("Authorization", String("Bearer ") + String(supabase_key));
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Prefer", "return=minimal");

      StaticJsonDocument<256> tel;
      tel["temperature"] = currentTemp;
      tel["humidity"] = currentHum;
      tel["motion"] = motionDetected;
      tel["is_dark"] = isDark;
      tel["ldr_raw"] = ldrRaw;
      tel["fan_on"] = fanRunning;
      tel["light_on"] = lightOn;

      String telPayload;
      serializeJson(tel, telPayload);
      int postHttpCode = http.POST(telPayload);

      if (postHttpCode > 0) {
        Serial.printf("[Cloud] Sync OK (GET: %d, POST: %d)\n", getHttpCode,
                      postHttpCode);
      } else {
        Serial.printf("[Cloud] POST Failed, Error: %s\n",
                      http.errorToString(postHttpCode).c_str());
      }
      http.end();

    } else {
      cloudSyncActive = false;
      Serial.println("[Cloud] WiFi Disconnected. Reconnecting...");
      WiFi.reconnect();
    }
  }
}