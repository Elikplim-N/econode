#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <RTClib.h>
#include <Adafruit_NeoPixel.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ==========================================
// WIFI & SUPABASE CONFIGURATIONS
// ==========================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Make sure to use /rest/v1 at the end of the Supabase URL
const char* supabase_url = "https://lhyxuuomjusjmkycuwuh.supabase.co/rest/v1";
const char* supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoeXh1dW9tanVzam1reWN1d3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwODc0NjIsImV4cCI6MjA1NjY2MzQ2Mn0.d_Ax_9uf6_yrx6lpwFzptpyL3AfB_VPo-sXEgavje54";

// ==========================================
// PIN DEFINITIONS & CONFIGURATIONS
// ==========================================
#define PIR_PIN       13
#define DHT_PIN       14
#define MOTOR_PIN     26
#define LED_PIN       27

#define DHTTYPE       DHT11
#define NUM_LEDS      1

#define TEMP_THRESHOLD    28.0  // Celsius
#define HUMIDITY_THRESHOLD 65.0 // Percent

#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1

// ==========================================
// GLOBAL OBJECTS & VARIABLES
// ==========================================
DHT dht(DHT_PIN, DHTTYPE);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
RTC_DS3231 rtc;
Adafruit_NeoPixel pixels(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

// FreeRTOS Mutex for the I2C Bus
SemaphoreHandle_t i2cMutex;

// Shared variables (volatile because they are accessed by multiple tasks)
volatile float currentTemp = 0.0;
volatile float currentHum = 0.0;
volatile bool fanRunning = false;
volatile bool motionDetected = false;
volatile bool lightOn = false;

// Cloud synced variables
volatile bool cloudModeManual = false;
volatile bool cloudFanOverride = false;
volatile bool cloudLightOverride = false;
volatile bool cloudSyncActive = false;

// ==========================================
// FREERTOS TASKS
// ==========================================

// TASK 1: Motion & LED (High Priority, Fast Execution)
void TaskMotionLED(void *pvParameters) {
  (void) pvParameters;
  for (;;) {
    motionDetected = digitalRead(PIR_PIN);

    // Determine if light should be on based on mode
    bool shouldBeOn = false;
    if (cloudModeManual) {
      shouldBeOn = cloudLightOverride; // Dashboard MANUAL mode
    } else {
      shouldBeOn = motionDetected;     // Firmware AUTO mode logic
    }

    lightOn = shouldBeOn;

    if (shouldBeOn) {
      pixels.setPixelColor(0, pixels.Color(255, 200, 100)); // Warm White nightlight
    } else {
      pixels.setPixelColor(0, pixels.Color(0, 0, 0)); // Off
    }
    pixels.show();

    // Yield to scheduler for 100 ticks (approx 100ms)
    vTaskDelay(100 / portTICK_PERIOD_MS); 
  }
}

// TASK 2: Environmental Sensors & Fan (Normal Priority, Slow Execution)
void TaskSensors(void *pvParameters) {
  (void) pvParameters;
  for (;;) {
    float t = dht.readTemperature();
    float h = dht.readHumidity();

    // Only update globals if reading was successful
    if (!isnan(t) && !isnan(h)) {
      currentTemp = t;
      currentHum = h;

      bool shouldRunFan = false;
      if (cloudModeManual) {
        shouldRunFan = cloudFanOverride; // Dashboard MANUAL mode
      } else {
        // Firmware AUTO mode logic
        shouldRunFan = (currentTemp >= TEMP_THRESHOLD || currentHum >= HUMIDITY_THRESHOLD);
      }

      fanRunning = shouldRunFan;
      
      if (shouldRunFan) {
        digitalWrite(MOTOR_PIN, HIGH);
      } else {
        digitalWrite(MOTOR_PIN, LOW);
      }
    }
    
    // Yield to scheduler for 2000ms
    vTaskDelay(2000 / portTICK_PERIOD_MS); 
  }
}

// TASK 3: Cloud Sync via Supabase REST API (Normal Priority)
void TaskCloudSync(void *pvParameters) {
  (void) pvParameters;
  
  // Wait for Wi-Fi connection
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    vTaskDelay(500 / portTICK_PERIOD_MS);
  }

  for (;;) {
    if (WiFi.status() == WL_CONNECTED) {
      cloudSyncActive = true;
      HTTPClient http;
      
      // 1. GET Settings from Supabase
      String settingsUrl = String(supabase_url) + "/econode_device_settings?id=eq.1&select=*";
      http.begin(settingsUrl);
      http.addHeader("apikey", supabase_key);
      http.addHeader("Authorization", String("Bearer ") + String(supabase_key));
      
      int httpCode = http.GET();
      if (httpCode > 0) {
        String payload = http.getString();
        
        // Note: For ArduinoJson 7.x, use `JsonDocument doc;` instead.
        StaticJsonDocument<512> doc; 
        DeserializationError error = deserializeJson(doc, payload);
        
        if (!error && doc.size() > 0) {
           JsonObject row = doc[0];
           String modeStr = row["mode"].as<String>();
           
           cloudModeManual = (modeStr == "MANUAL");
           cloudFanOverride = row["fan_override"].as<bool>();
           cloudLightOverride = row["light_override"].as<bool>();
        }
      }
      http.end();

      // 2. POST Telemetry to Supabase
      String telemetryUrl = String(supabase_url) + "/econode_telemetry";
      http.begin(telemetryUrl);
      http.addHeader("apikey", supabase_key);
      http.addHeader("Authorization", String("Bearer ") + String(supabase_key));
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Prefer", "return=minimal"); // Save bandwidth by not requesting full row back

      StaticJsonDocument<256> tel;
      tel["temperature"] = currentTemp;
      tel["humidity"] = currentHum;
      tel["motion"] = motionDetected;
      tel["is_dark"] = false; // Note: Replace with actual LDR reading if added physically
      tel["fan_on"] = fanRunning;
      tel["light_on"] = lightOn;

      String telPayload;
      serializeJson(tel, telPayload);

      http.POST(telPayload);
      http.end();
      
    } else {
      cloudSyncActive = false;
      WiFi.reconnect(); // Attempt reconnection if disconnected
    }
    
    // Cloud sync every 3 seconds
    vTaskDelay(3000 / portTICK_PERIOD_MS);
  }
}

// TASK 4: Display & Clock (Normal Priority, 1Hz Execution)
void TaskDisplay(void *pvParameters) {
  (void) pvParameters;
  for (;;) {
    int currentHour = 0;
    int currentMinute = 0;

    // --- LOCK I2C BUS ---
    if (xSemaphoreTake(i2cMutex, portMAX_DELAY) == pdTRUE) {
      DateTime now = rtc.now();
      currentHour = now.hour();
      currentMinute = now.minute();
      xSemaphoreGive(i2cMutex); // --- UNLOCK I2C BUS ---
    }

    // --- LOCK I2C BUS ---
    if (xSemaphoreTake(i2cMutex, portMAX_DELAY) == pdTRUE) {
      display.clearDisplay();

      // Top Row: Time & System Status
      display.setTextSize(1);
      display.setCursor(0, 0);
      display.printf("%02d:%02d", currentHour, currentMinute);
      
      display.setCursor(55, 0);
      if (cloudSyncActive) {
        display.print("SYNC OK");
      } else {
        display.print("NO SYNC");
      }

      display.drawLine(0, 10, 128, 10, SSD1306_WHITE);

      // Middle Area: Core Metrics
      display.setTextSize(2);
      display.setCursor(0, 16);
      display.print("Tmp:");
      display.print((int)currentTemp);
      display.print("C");

      display.setCursor(0, 36);
      display.print("Hum:");
      display.print((int)currentHum);
      display.print("%");

      // Bottom Row
      display.drawLine(0, 53, 128, 53, SSD1306_WHITE);
      display.setTextSize(1);
      display.setCursor(0, 56);
      
      // Show M (Manual) or A (Auto) based on cloud sync state
      display.print(cloudModeManual ? "M:" : "A:");
      display.print(fanRunning ? "FAN" : "OFF");
      
      display.setCursor(70, 56);
      display.print(lightOn ? "LIT" : "DRK"); 
      display.print(motionDetected ? "-OCC" : "-MTY");

      display.display();
      xSemaphoreGive(i2cMutex); // --- UNLOCK I2C BUS ---
    }

    // Update screen every 1000ms
    vTaskDelay(1000 / portTICK_PERIOD_MS); 
  }
}

// ==========================================
// MAIN SETUP
// ==========================================
void setup() {
  Serial.begin(115200);

  // Hardware Init
  pinMode(PIR_PIN, INPUT);
  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW); 

  pixels.begin();
  pixels.setBrightness(150); 
  pixels.clear();           
  pixels.show();

  Wire.begin();

  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 failed"));
    for(;;); 
  }
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  if (!rtc.begin()) {
    Serial.println("RTC failed");
    while (1);
  }

  dht.begin();
  
  // Create the Mutex
  i2cMutex = xSemaphoreCreateMutex();

  if (i2cMutex != NULL) {
    // Create Tasks
    // Arguments: Function, Name, Stack Size, Parameter, Priority, Task Handle
    xTaskCreate(TaskMotionLED, "MotionTask", 2048,  NULL, 2, NULL); // Highest priority
    xTaskCreate(TaskSensors,   "SensorTask", 2048,  NULL, 1, NULL); 
    
    // Cloud task requires larger stack size (8192 bytes) due to HTTPS & JSON parsing overhead
    xTaskCreate(TaskCloudSync, "CloudSync",  8192,  NULL, 1, NULL); 
    xTaskCreate(TaskDisplay,   "DisplayTask", 4096, NULL, 1, NULL); // Larger stack for OLED graphics
    
    Serial.println("FreeRTOS Scheduler Running...");
  }
}

// ==========================================
// MAIN LOOP
// ==========================================
void loop() {
  // In a FreeRTOS architecture, the main loop is left completely empty.
  // The RTOS scheduler handles execution of the tasks created in setup().
  vTaskDelete(NULL); 
}
