const encoder = require("./rotary_encoder");
const EventEmitter = require('events').EventEmitter;

module.exports = (gpioA, gpioB, options) =>
{
    options = options || {};
    /* short circuit evaluation */
    !('min' in options) && (options.min = 0x00);
    !('max' in options) && (options.max = 0xFF);
    !('step' in options) && (options.step = 0x01);
    !('initial' in options) && (options.initial = 0x00);

    let value = options.initial;


    const emitter = new EventEmitter();
    const encoderEvents = encoder(gpioA, gpioB);

    value -= options.min;
    options.max -= options.min;
    
    encoderEvents.on("rotation", val => 
    {
        if(val > 0)
        {
            value += options.step;
        }
        else
        {
            value -= options.step;
        }

        value += options.max;
        value %= options.max;

        emitter.emit('value', options.min + value);
    });

    return emitter;
}