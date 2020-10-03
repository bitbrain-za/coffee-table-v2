/* 
Config
*/

const fs = require("fs");
const rawData = fs.readFileSync("./config.json");
config = JSON.parse(rawData);
const MQTT_CONFIG = "./mqtt_conf.json";

/*
Buttons
*/

const binarySensor = require("./components/button");
config.Button.forEach(function (entry) {
  console.log(entry);
  var button = new binarySensor(MQTT_CONFIG, entry.Pin, entry.Name);

  button.emitter.on("click", (val) => console.log(val));
});

const sensor = require("./components/dial");
const volume = require("./components/volume");
config.Encoder.forEach(function (entry) {
  console.log(entry);
  switch (entry.type) {
    case "generic":
      var dial = new sensor(MQTT_CONFIG, entry);
      dial.emitter.on("value", (val) => pixel.gauge(val));
      break;

    case "volume":
      var vol = new volume(MQTT_CONFIG, entry);
      vol.emitter.on("connect", (val) =>
        console.log(`Onkyo connected at ${val}`)
      );
      vol.emitter.on("value", (val) => pixel.gauge(val));
      break;
  }
});

/*
RFID
*/

const mqtt = require("mqtt");
const rfid = require("./lib/rfid");
let mqttConf = {};

if (fs.existsSync(MQTT_CONFIG)) {
  const rawData = fs.readFileSync(MQTT_CONFIG);
  mqttConf = JSON.parse(rawData);
}

let mqttOptions = {
  port: mqttConf.port,
  clientId: mqttConf.id + "_" + Math.random().toString(16).substr(2, 8),
  username: mqttConf.username,
  password: mqttConf.password,
  clean: true,
  reconnectPeriod: 5000,
};

rfidClient = mqtt.connect(`mqtt://${mqttConf.broker}`, mqttOptions);

rfidClient.on("connect", () => {
  console.log("RFID MQTT connected");
});

rfidClient.on("error", (error) => {
  console.log("Can't connect: " + error);
});

const rfidEmitter = rfid();
rfidEmitter.on("tag", (tag) => {
  console.log("Tag: " + tag);
  rfidClient.publish(config.RFID.topic, tag);
});

/*
Neopixel
*/

const neo = require("./lib/neopixel");
pixel = new neo(config.WS2812.Length, config.WS2812.Pin);

/*
Web Interface
*/

const www = require("./www/index");
const web = www();

web.on("animation-request", (animation) => {
  console.log(animation);
  switch (animation) {
    case "fire":
      pixel.Fire();
      break;

    case "rainbow":
      pixel.Rainbow();
      break;

    case "running":
      pixel.RunningLights();
      break;

    default:
      pixel.setColour(0, 0, 0);
      break;
  }
});

web.on("rgb-request", (rgb) => {
  console.log(rgb);
  const hexColour = Number("0x" + rgb);
  const r = hexColour >> 16;
  const g = (hexColour >> 8) & 0xff;
  const b = hexColour & 0xff;
  console.log(hexColour);
  console.log(r);
  console.log(g);
  console.log(b);
  pixel.setColour(r, g, b, true, 0);
});

web.on("admin-request", (request) => {
  console.log(request);
});

/*
Light
*/

const halight = require("./components/light");
var light = new halight(MQTT_CONFIG);

light.emitter.on("state", (state) => {
  if (state.state === "ON") {
    pixel.turnOn();
    if ("color" in state)
      pixel.setColour(state.color.r, state.color.g, state.color.b, true, 0);
    if ("brightness" in state) pixel.setBrightness(state.brightness);
    if ("effect" in state) {
      switch (state.effect) {
        case "fire":
          pixel.Fire();
          break;
        case "rainbow":
          pixel.Rainbow();
          break;
        case "running lights":
          pixel.RunningLights();
          break;
      }
    }
    if ("color_temp" in state) {
      pixel.setColourTemperature(state.color_temp);
    }
  } else {
    pixel.turnOff();
  }
  light.update(state);
});
