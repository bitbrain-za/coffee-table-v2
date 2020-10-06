const mqtt = require("mqtt");
const network = require("network");
const fs = require("fs");
const { EventEmitter } = require("events");
const encoder = require("../lib/encoder_value");
const logger = require('winston');

module.exports = class {
  constructor(config_path, config) {
    this.emitter = new EventEmitter();
    this.name = config.Name;

    const dial = encoder(config.gpioA, config.gpioB, config);

    dial.on("change", (val) => {
      let message = {
        VALUE: val,
      };
      this.emitter.emit("value", val);
      this.client.publish(this.topic, JSON.stringify(message));
    });

    this.mqttConf = {};
    if (fs.existsSync(config_path)) {
      const rawData = fs.readFileSync(config_path);
      this.mqttConf = JSON.parse(rawData);
    }

    network.get_active_interface((err, obj) => {
      this.mac = obj.mac_address.split(":").join("");

      this.discoveryTopic = `homeassistant/sensor/${this.mqttConf.id}${this.mac}/${this.name}/config`;
      this.availability_topic = `${this.mqttConf.id}${this.mac}/availability`;
      this.topic = `${this.mqttConf.id}${this.mac}/${this.name}/value`;
      let disco = this.discoveryMessage();

      let options = {
        port: this.mqttConf.port,
        clientId:
          this.mqttConf.id + "_" + Math.random().toString(16).substr(2, 8),
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
        this.client.publish(availability_topic, "online", { retain: true });
      });
    });

  }

  discoveryMessage() {
    const config = {
      name: this.name,
      unique_id: this.mqttConf.id + this.mac + "_" + this.name,

      device: {
        identifiers: [`CT${this.mac}`],
        manufacturer: "Bitbrain",
        model: "Coffee Table Controller v2",
        name: "CT" + this.mac,
        sw_version: "2.0.1",
      },

      availability_topic: this.availability_topic,
      state_topic: this.topic,
      value_template: "{{ value_json.VALUE }}",
      icon: "mdi:adjust",
    };

    return {
      topic: this.discoveryTopic,
      message: config,
    };
  }
};
