const encoder = require("./rotary_encoder");
const EventEmitter = require('events').EventEmitter;


module.exports = (gpioA, gpioB, debounceTimeout = 1, min = 0, max = 0xFF, step = 1, value = 0) =>
{
    const emitter = new EventEmitter();
    const encoderEvents = encoder(gpioA, gpioB, debounceTimeout);

    value -= min;
    max -= min;
    
    encoderEvents.on("rotation", val => 
    {
        if(val > 0)
        {
            value += step;
        }
        else
        {
            value -= step;
        }

        value += max;
        value %= max;

        emitter.emit('value', min + value);
    });

    return emitter;
}