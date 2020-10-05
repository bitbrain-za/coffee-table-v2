const mqtt = require("mqtt");
const network = require("network");
const fs = require("fs");
const { EventEmitter } = require("events");
const encoder = require("../lib/encoder_value");
const receiver = require("eiscp");
const util = require("util");
const logger = require('winston');

module.exports = class {
  constructor(config_path, config) {
    this.emitter = new EventEmitter();
    this.name = config.Name;
    receiver.on("error", util.log);

    let eiscp_options = {
      reconnect: true,
      send_delay: 500,
      reconnect_sleep: 5,
    };
    receiver.connect(eiscp_options);

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
      this.topic = `${this.mqttConf.id}${this.mac}/${this.name}/value`;
      let disco = this.discoveryMessage();

      this.client.publish(disco.topic, JSON.stringify(disco.message), {
        retain: true,
      });
    });

    let mqtt_options = {
      port: this.mqttConf.port,
      clientId:
        this.mqttConf.id + "_" + Math.random().toString(16).substr(2, 8),
      username: this.mqttConf.username,
      password: this.mqttConf.password,
      clean: true,
      reconnectPeriod: 5000,
    };
    this.client = mqtt.connect(`mqtt://${this.mqttConf.broker}`, mqtt_options);
    this.client.on("error", (error) => {
      logger.error("Can't connect: " + error);
    });

    this.enabled = true;
    this.timeoutHandle;

    dial.on("change", (val) => {
      let hexString = val.toString(16);
      this.emitter.emit("value", val);
      let message = {
        VALUE: val,
      };
      this.client.publish(this.topic, JSON.stringify(message));
      if (this.enabled) {
        this.enabled = false;
        // ~500ms
        // console.time();
        receiver.raw(`MVL${hexString}`, () => {
          // console.timeEnd();
          this.enabled = true;
          this.emitter.emit("set", val);
        });
      } else {
        this.enabled = false;
        clearTimeout(this.timeoutHandle);
        this.timeoutHandle = setTimeout(() => {
          receiver.raw(`MVL${hexString}`, () => {
            this.emitter.emit("set", val);
            this.enabled = true;
          });
        }, 100);
      }
    });

    receiver.on("connect", (data) => {
      this.emitter.emit("connect", data);
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
