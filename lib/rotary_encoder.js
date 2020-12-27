const EventEmitter = require('events').EventEmitter;
const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO

module.exports = (gpioA, gpioB, clicksPerStep = 1) =>
{
    const emitter = new EventEmitter();
    var pinA = new Gpio(gpioA, 'in', 'both');
    var pinB = new Gpio(gpioB, 'in', 'both');

    let a = 2;
    let b = 2;
    let clicks = 0;

    pinA.watch((err, val) =>
    { 
        if (err) 
        { 
            emitter.emit('error', err);
            return;
        }

        a = val;
    });

    pinB.watch((err, val) =>
    { 
        if (err) 
        { 
            emitter.emit('error', err);
            return;
        }

        b = val;
        tick();
    });

    function tick()
    {
        if (a === 0 && b === 0 || a === 1 && b === 1) 
        {
            if(++clicks >= clicksPerStep)
            {
                emitter.emit('rotation', 1);
                clicks = 0;
            }
        } 
        else if (a === 1 && b === 0 || a === 0 && b === 1 || a === 2 && b === 0) 
        {
            if(--clicks <= (-1 * clicksPerStep))
            {
                emitter.emit('rotation', -1);
                clicks = 0;
            }
        }
    }

    return emitter;
}