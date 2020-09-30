const mqtt = require("mqtt");
const fs = require("fs");
const { EventEmitter } = require("events");
const network = require("network");

module.exports = class HAMQTT{
  constructor(config_path) {
    this.emitter = new EventEmitter();

    this.baseTopic;
    this.discoveryTopic;
    this.commandTopic;
    this.stateTopic;
    this.mac = "";

    const confPath = config_path;
    this.mqttConf = {};

    if (fs.existsSync(confPath)) {
      const rawData = fs.readFileSync(confPath);
      this.mqttConf = JSON.parse(rawData);
    }

    network.get_active_interface((err, obj) => {
      this.mac = obj.mac_address.split(":").join("");

      this.baseTopic = `homeassistant/light/${this.mqttConf.id}${this.mac}`;
      this.discoveryTopic = this.baseTopic + "/config";
      this.commandTopic = `${this.mqttConf.id}${this.mac}/set`;
      this.stateTopic = `${this.mqttConf.id}${this.mac}/state`;
      this.client.subscribe(this.commandTopic);
      this.discoveryMessage();
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

    this.client.on("connect", () => {
      console.log("connected");
      this.client.publish(this.stateTopic, "alive");
      this.update({state:'OFF'});
    });

    this.client.on("error", (error) => {
      console.log("Can't connect: " + error);
    });

    this.client.on("message", (topic, message) => {
      if (topic === this.commandTopic) {
        let cmd = JSON.parse(message.toString("utf8"));
        console.log("Command Received");
        console.log(cmd);

        this.emitter.emit("state", cmd);
      }
    });

  }

  discoveryMessage() {
    const config = {
      name: this.mqttConf.id,
      unique_id: this.mqttConf.id + this.mac,

      device: {
        identifiers: [`CT${this.mac}`],
        manufacturer: "Bitbrain",
        model: "Coffee Table Controller v2",
        name: "CT" + this.mac,
        sw_version: "2.0.1",
      },

      state_topic: this.stateTopic,
      command_topic: this.commandTopic,

      brightness: true,
      rgb: true,
      color_temp: true,
      effect: true,
      effect_list: ["none", "fire", "rainbow", "running lights"],

      schema: "json",
      optimistic: false,
    };

    this.client.publish(this.discoveryTopic, JSON.stringify(config), { retain: true });
  }

  update(state) {
    this.client.publish(this.stateTopic, JSON.stringify(state), { retain: false });
  }
};

