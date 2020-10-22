const encoder = require("./rotary_encoder");
const EventEmitter = require('events').EventEmitter;

module.exports = (gpioA, gpioB, options) =>
{
    options = options || {};
    /* short circuit evaluation */
    !('debounceTimeout' in options) && (options.debounceTimeout = 0x00);
    !('min' in options) && (options.min = 0x00);
    !('max' in options) && (options.max = 0xFF);
    !('step' in options) && (options.step = 0x01);
    !('initial' in options) && (options.initial = 0x00);
    !('clicksPerStep' in options) && (options.clicksPerStep = 0x01);

    let value = options.initial;
    const emitter = new EventEmitter();
    const encoderEvents = encoder(gpioA, gpioB, options.debounceTimeout, options.clicksPerStep);
    let previous = value;
    
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
        if(value > options.max)
        {
            value = options.max;
        }
        if(value < options.min)
        {
            value = options.min;
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