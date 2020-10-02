
/*
Volume
*/

const vol = require("./volume_control")(24, 25);
vol.on("connect", (val) => console.log(`Onkyo connected at ${val}`));
vol.on("change", (val) => pixel.gauge(val));

/*
RFID
*/

// const rfid = require("./lib/rfid");
// const rfidEmitter = rfid();
// rfidEmitter.on("tag", tag => {
//     console.log("Tag: " + tag);
// });

/*
Neopixel
*/

const neo = require("./lib/neopixel");
pixel = new neo(100, 18);

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
MQTT
*/

const mqtt = require("./lib/ha_mqtt");
var talker = new mqtt("./mqtt_conf.json");

talker.emitter.on("state", (state) => {
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
  talker.update(state);
});
