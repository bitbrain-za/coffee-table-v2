const EventEmitter = require('events').EventEmitter;
const encoder = require("./lib/encoder_value");
const receiver = require("../eiscp.js/eiscp");
const util = require('util');

module.exports = (gpioA, gpioB) =>
{
    const emitter = new EventEmitter();

    // receiver.on("debug", util.log);
    receiver.on("error", util.log);

    let options =
    {
        reconnect: true,
        send_delay: 0,
        reconnect_sleep: 30
    }
    receiver.connect(options);

    let config = {
        min: 0,
        max: 80,
        step: 1,
        initial: 40,
        debounceTimeout: 10
    };
    const encoderEvents = encoder(gpioA, gpioB, config);

    let enabled = true;
    var timeoutHandle;

    encoderEvents.on("change", (val) =>
    {
        console.log(val);
        hexString = val.toString(16);
        emitter.emit('change', val);
        if(enabled)
        {
            enabled = false;
            // ~500ms
            console.time();
            receiver.raw(`MVL${hexString}`, () => 
            {
                console.timeEnd(); 
                enabled = true; 
                emitter.emit('set', val);
            });
        }
        else
        {
            enabled = false;
            clearTimeout(timeoutHandle);
            timeoutHandle = setTimeout(() => {
                receiver.raw(`MVL${hexString}`, () => 
                {
                    emitter.emit('set', val);
                    enabled = true;
                });
            }, 100);
        }
    });

    receiver.on("connect", (data) => {
        emitter.emit('connect', data);
    });

    return emitter;
}