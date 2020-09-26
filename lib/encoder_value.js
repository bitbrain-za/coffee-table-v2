const encoder = require("./rotary_encoder");
const EventEmitter = require('events').EventEmitter;


module.exports = (gpioA, gpioB, debounceTimeout = 1, min = 0, max = 0xFF, step = 1, value = 0) =>
{
    const emitter = new EventEmitter();
    const encoderEvents = encoder(gpioA, gpioB, debounceTimeout);
    let previous = value;
    
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
        if(value > max)
        {
            value = max;
        }
        if(value < min)
        {
            value = min;
        }
        emitter.emit('value', value);

        if(previous != value)
        {
            previous = value;
            emitter.emit('change', value);
        }
    });

    return emitter;
}