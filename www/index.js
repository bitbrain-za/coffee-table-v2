const { EventEmitter } = require('events');
const express = require('express');
const path = require('path');
const fs = require('fs');

module.exports = () => {
  const emitter = new EventEmitter();
  const app = express();

  const port = 3000;

  function updateForm() {
    const confPath = 'mqtt_conf.json';
    let htmlCont = fs.readFileSync('./www/index.html', { encoding: 'utf-8' });
    let mqttConf = {};

    if (fs.existsSync(confPath)) {
      const rawData = fs.readFileSync(confPath);
      mqttConf = JSON.parse(rawData);
    }

    let imRegex = new RegExp('\\$mqtt_id', 'gm');
    let repl = 'value = Device CT';
    if ('id' in mqttConf) {
      repl = `value = ${mqttConf.id}`;
    }
    htmlCont = htmlCont.replace(imRegex, repl);

    imRegex = new RegExp('\\$mqtt_broker_val', 'gm');
    repl = 'placeholder = localhost';
    if ('broker' in mqttConf) {
      repl = `value = ${mqttConf.broker}`;
    }
    htmlCont = htmlCont.replace(imRegex, repl);

    imRegex = new RegExp('\\$mqtt_port', 'gm');
    repl = 'placeholder = 1883';
    if ('port' in mqttConf) {
      repl = `value = ${mqttConf.port}`;
    }
    htmlCont = htmlCont.replace(imRegex, repl);

    imRegex = new RegExp('\\$mqtt_user', 'gm');
    repl = 'placeholder = username';
    if ('username' in mqttConf) {
      repl = `value = ${mqttConf.username}`;
    }
    htmlCont = htmlCont.replace(imRegex, repl);

    imRegex = new RegExp('\\$mqtt_pass', 'gm');
    repl = 'placeholder = password';
    if ('password' in mqttConf) {
      repl = `value = ${mqttConf.password}`;
    }
    htmlCont = htmlCont.replace(imRegex, repl);

    return htmlCont;
  }

  app.use(express.static(path.join(__dirname, './static')));
  app.use(
    express.urlencoded({
      extended: true,
    })
  );

  app.get('/', (request, response) => {
    let html = updateForm();

    const confPath = 'mqtt_conf.json';
    let mqttConf = {};

    if (fs.existsSync(confPath)) {
      const rawData = fs.readFileSync(confPath);
      mqttConf = JSON.parse(rawData);
    }

    const imRegex = new RegExp('\\$name', 'gm');
    let repl = 'Coffee Table';
    if ('id' in mqttConf) {
      repl = `${mqttConf.id}`;
    }
    html = html.replace(imRegex, repl);

    response.writeHead(200, { 'content-type': 'text/html' });
    response.write(html);
    response.end();
  });

  app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
  });

  app.post('/animation-request', (req, response) => {
    response.redirect(path.join(req.baseUrl, '/'));
    emitter.emit('animation-request', req.body.animation);
  });

  app.post('/rgb-request', (req, response) => {
    response.redirect(path.join(req.baseUrl, '/'));
    emitter.emit('rgb-request', req.body.colour);
  });

  app.post('/admin-request', (req, response) => {
    response.redirect(path.join(req.baseUrl, '/'));
    emitter.emit('admin-request', req.body.admin);
  });

  app.post('/config-save', (req, response) => {
    response.redirect(path.join(req.baseUrl, '/'));

    const data = JSON.stringify(req.body, null, 4);

    fs.writeFile('mqtt_conf.json', data, (err) => {
      if (err) {
        throw err;
      }
      emitter.emit('config-update', true);
    });
  });

  return emitter;
};
