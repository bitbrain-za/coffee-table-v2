const ws281x = require("rpi-ws281x");
const colourWheel = require("./colour_wheel");
const randInt = require("./randInt");
const fs = require("fs");
const ct = require('color-temp');
const transforms = require("./color_transforms");

module.exports = class Neopixel {
  constructor(leds = 32, gpio = 18) {
    this.state = {
      state: "off",
      mode: "rgb",
      color: "0x00FFFFFF",
      brightness: "255",
    };

    this.config = {};

    // Number of leds in my strip
    this.config.leds = leds;

    // Use DMA 10 (default 10)
    this.config.dma = 10;

    // Set full brightness, a value from 0 to 255 (default 255)
    this.config.brightness = 255;

    // Set the GPIO number to communicate with the Neopixel strip (default 18)
    this.config.gpio = gpio;

    // The RGB sequence may vary on some strips. Valid values
    // are "rgb", "rbg", "grb", "gbr", "bgr", "brg".
    // Default is "rgb".
    // RGBW strips are not currently supported.
    this.config.type = "grb";

    // Configure ws281x

    var timeoutHandle;
    this._prep_gauge();
    ws281x.configure(this.config);
    this.map = new Uint32Array(this.config.leds);
    this.restoreState();
  }

  saveState() {
    const data = JSON.stringify(this.state, null, 4);

    fs.writeFile("session.json", data, (err) => {
      if (err) {
        return;
      }
    });
  }

  restoreState() {
    if (fs.existsSync("session.json")) {
      const rawData = fs.readFileSync("session.json");
      try {
        this.state = JSON.parse(rawData);
      } catch (error) {
        return;
      }

      if (this.state.mode == "rgb") {
        for (var i = 0; i < this.config.leds; i++)
          this.map[i] = this.state.color;
        this.scaleBrightness(this.state.brightness);
        if (this.state.state == "ON") ws281x.render(this.map);
      }
      if (this.state.mode == "rainbow") this.Rainbow();
      if (this.state.mode == "fire") this.Fire();
      if (this.state.mode == "running_lights") this.RunningLights();
    }
  }

  turnOff() {
    this.state.state = "OFF";
    this.saveState();
    var temp = new Uint32Array(this.config.leds);
    for (var i = 0; i < this.config.leds; i++) temp[i] = 0;
    ws281x.render(temp);
    console.log("Turned off");
  }

  turnOn() {
    this.state.state = "ON";
    this.state.mode = "rgb";
    this.saveState();
    ws281x.render(this.map);
  }

  scaleBrightness(brightness, old = 255) {
    if (old == brightness) return;

    for (let i = 0; i < this.config.leds; ++i) {
      let color = transforms.toRGB(this.map[i]);
      color.r = (color.r * brightness) / old;
      color.g = (color.g * brightness) / old;
      color.b = (color.b * brightness) / old;
      this.map[i] = transforms.toUint32(color.r, color.g, color.b);
    }
    this.state.brightness = brightness;
    this.saveState();
  }

  set(val, duration = 0)
  {
    if (duration == 0) {
      this.map = val;
      ws281x.render(this.map);
    } else {
      ws281x.render(val);
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = setTimeout(() => ws281x.render(this.map), duration);
    }
  }

  setBrightness(brightness) {
    this.scaleBrightness(brightness, this.state.brightness);
    ws281x.render(this.map);
  }

  setColour(red = 0, green = 0, blue = 0, render = true, duration = 0) {
    this.state.mode = "rgb";
    var temp = new Uint32Array(this.config.leds);

    this.state.color = transforms.toUint32(red, green, blue);
    this.saveState();

    for (var i = 0; i < this.config.leds; i++) temp[i] = this.state.color;

    if (duration == 0) {
      this.map = temp;
      this.scaleBrightness(this.state.brightness);
      ws281x.render(this.map);
    } else {
      ws281x.render(temp);
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = setTimeout(() => ws281x.render(this.map), duration);
    }
  }

  setColourTemperature(temperature) {
    const COLOR_TEMP_HA_MIN_IN_MIRED = 153;
    const COLOR_TEMP_HA_MAX_IN_MIRED = 500;

    if (
      temperature < COLOR_TEMP_HA_MIN_IN_MIRED ||
      temperature > COLOR_TEMP_HA_MAX_IN_MIRED
    )
      return;

    let tmpKelvin = 1000000 / temperature;
    var rgb = ct.temp2rgb(tmpKelvin);    
    this.setColour(rgb[0], rgb[1], rgb[2]);
  }

  _prep_gauge()
  {
    let multiplier = 255 / this.config.leds;
    this.gauge_map = new Uint32Array(this.config.leds);
    for(var i = 0 ; i < this.config.leds ; ++i)
    {
      this.gauge_map[i] = transforms.toUint32(Math.round(i * multiplier), 0, Math.round(255 - (i*multiplier)))
    }
  }

  gauge(value)
  {
    let temp = Uint32Array.from(this.gauge_map);
    let count = Math.round((value / 100) * this.config.leds)
    for(var i = count ; i < this.config.leds ; ++i)
        temp[i] = 0;
    this.set(temp, 1000);
  }

  setPixel(pixel, red, green, blue, render = false) {
    var colour = transforms.toUint32(red, green, blue);
    this.map[pixel] = colour;

    if (render) {
      ws281x.render(this.map);
    }
  }

  Rainbow(speed = 200, offset = 0) {
    this.state.mode = "rainbow";
    this.saveState();
    this.RainbowOffset = offset;
    this._rainbow(speed);
    var temp = new Uint32Array(this.config.leds);
    for (var i = 0; i < this.config.leds; i++) {
      temp[i] = colourWheel((this.RainbowOffset + i) % 256);
    }

    this.RainbowOffset = (this.RainbowOffset + 1) % 256;
    ws281x.render(temp);
  }

  _rainbow(speed) {
    setTimeout(() => {
      if (this.state.mode === "rainbow" && this.state.state == "ON") {
        this._rainbow(speed);
        var temp = new Uint32Array(this.config.leds);
        for (var i = 0; i < this.config.leds; i++) {
          temp[i] = colourWheel((this.RainbowOffset + i) % 256);
        }

        this.RainbowOffset = (this.RainbowOffset + 1) % 256;
        ws281x.render(temp);
      }
    }, speed);
  }

  Fire(cooling = 55, sparking = 80, speed_delay = 20) {
    this.state.mode = "fire";
    this.saveState();
    this.heat = new Array(this.config.leds).fill(0);
    this._fire(cooling, sparking, speed_delay);
  }

  _fire(cooling, sparking, speed_delay) {
    setTimeout(() => {
      if (this.state.mode == "fire" && this.state.state == "ON") {
        this._fire(cooling, sparking, speed_delay);
        for (var i = 0; i < this.config.leds; i++) {
          var cooldown = randInt(0, (cooling * 10) / this.config.leds + 20);

          if (cooldown > this.heat[i]) this.heat[i] = 0;
          else this.heat[i] -= cooldown;
        }

        for (var i = this.config.leds - 1; i > 3; --i) {
          this.heat[i] =
            (this.heat[i - 1] + this.heat[i - 2] + this.heat[i - 2]) / 3;
        }

        if (randInt(0, 255) < sparking) {
          let y = randInt(0, 7);
          this.heat[y] = this.heat[y] + randInt(160, 255);
        }

        var temp = new Uint32Array(this.config.leds);
        for (var i = 0; i < this.config.leds; i++) {
          temp[i] = this.setPixelHeat(i, this.heat[i]);
        }
        ws281x.render(temp);
      }
    }, speed_delay);
  }

  setPixelHeat(pixel, temperature, map) {
    let t192 = Math.round((temperature / 255.0) * 191);
    let heatramp = t192 & 0x3f;

    if (t192 > 0x80)
      return ((255 & 0xff) << 16) + ((255 & 0xff) << 8) + (heatramp & 0xff);
    else if (t192 > 0x40)
      return ((255 & 0xff) << 16) + ((heatramp & 0xff) << 8) + (0 & 0xff);
    else return ((heatramp & 0xff) << 16) + ((0 & 0xff) << 8) + (0 & 0xff);
  }

  RunningLights(red = 0xff, green = 0xff, blue = 0xff, delay = 50) {
    this.state.mode = "running_lights";
    this.saveState();
    this.position = 0;
    this._running_lights(red, green, blue, delay);
  }

  _running_lights(red = 0xff, green = 0xff, blue = 0xff, delay = 50) {
    setTimeout(() => {
      if (this.state.mode == "running_lights" && this.state.state == "ON") {
        this._running_lights(red, green, blue, delay);
        var temp = new Uint32Array(this.config.leds);
        for (var i = 0; i < this.config.leds; ++i) {
          temp[i] =
            ((((Math.sin(i + this.position) * 127 + 128) / 255) * red) << 16) +
            ((((Math.sin(i + this.position) * 127 + 128) / 255) * green) << 8) +
            ((Math.sin(i + this.position) * 127 + 128) / 255) * blue;
        }
        ++this.position;
        ws281x.render(temp);
      }
    }, delay);
  }
};
