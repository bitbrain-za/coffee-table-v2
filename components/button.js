const mqtt = require("mqtt");
const network = require("network");
const fs = require('fs');
const { EventEmitter } = require("events");
const Gpio = require("onoff").Gpio; //include onoff to interact with the GPIO

module.exports = class {
  constructor(config_path, pin, name) {
    this.emitter = new EventEmitter();
    let button = new Gpio(pin, "in", "rising");
    this.name = name;

    button.watch((err, val) => {
      if (err) {
        emitter.emit("error", err);
        return;
      }
      this.click(val);
    });

    this.mqttConf = {};
    if (fs.existsSync(config_path)) {
      const rawData = fs.readFileSync(config_path);
      this.mqttConf = JSON.parse(rawData);
    }

    network.get_active_interface((err, obj) => {
      this.mac = obj.mac_address.split(":").join("");

      this.discoveryTopic = `homeassistant/binary_sensor/${this.mqttConf.id}${this.mac}/${name}/config`;
      this.topic = `${this.mqttConf.id}${this.mac}/${name}/click`;
      let disco = this.discoveryMessage();

      this.client.publish(disco.topic, JSON.stringify(disco.message), {
        retain: true,
      });
    });

    let options = {
      port: this.mqttConf.port,
      clientId: this.mqttConf.id + "_" + Math.random().toString(16).substr(2, 8),
      username: this.mqttConf.username,
      password: this.mqttConf.password,
      clean: true,
      reconnectPeriod: 5000,
    };
    this.client = mqtt.connect(`mqtt://${this.mqttConf.broker}`, options);
    this.client.on("error", (error) => {
      console.log("Can't connect: " + error);
    });

  }

  click(val) {
    let message = {
      STATE: "TOGGLE",
    };
    this.emitter.emit("click", val);
    this.client.publish(this.topic, JSON.stringify(message));
  }

  discoveryMessage() {
    const config = {
      name: this.name,
      unique_id: this.mqttConf.id + this.mac + "click_" + this.name,

      device: {
        identifiers: [`CT${this.mac}`],
        manufacturer: "Bitbrain",
        model: "Coffee Table Controller v2",
        name: "CT" + this.mac,
        sw_version: "2.0.1",
      },

      state_topic: this.topic,
      value_template: "{{value_json.STATE}}",
      pl_on: "TOGGLE",
      off_delay: 1,
      icon: "mdi:electric-switch"
    };

    return {
      topic: this.discoveryTopic,
      message: config,
    };
  }
};
