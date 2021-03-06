const mqtt = require("mqtt");
const network = require("network");
const fs = require('fs');
const { EventEmitter } = require("events");
const logger=require('winston');
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
      this.availability_topic = `${this.mqttConf.id}${this.mac}/availability`;
      let disco = this.discoveryMessage();

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
        logger.error("Can't connect: " + error);
      });

      this.client.on("connect", () => {
        this.client.publish(disco.topic, JSON.stringify(disco.message), {
          retain: true,
        });
        this.client.publish(this.availability_topic, "online", { retain: true });
      });
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

      availability_topic: this.availability_topic,
      state_topic: this.topic,
      value_template: "{{value_json.STATE}}",
      pl_on: "TOGGLE",
      off_delay: 1
    };

    return {
      topic: this.discoveryTopic,
      message: config,
    };
  }
};
