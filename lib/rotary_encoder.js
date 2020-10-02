const EventEmitter = require('events').EventEmitter;
const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO

module.exports = (gpioA, gpioB, debounceTimeout = 0) =>
{
    const emitter = new EventEmitter();
    var pinA = new Gpio(gpioA, 'in', 'both');
    var pinB = new Gpio(gpioB, 'in', 'both');

    let a = 2;
    let b = 2;

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

    var timerExpired = true;

    function tick()
    {
        if(!timerExpired)
        {
            return;
        }
        
        if (a === 0 && b === 0 || a === 1 && b === 1) 
        {
            emitter.emit('rotation', 1);
        } 
        else if (a === 1 && b === 0 || a === 0 && b === 1 || a === 2 && b === 0) 
        {
            emitter.emit('rotation', -1);
        }
        setTimeout(() => timerExpired = true, debounceTimeout);
        timerExpired = false;

    }

    return emitter;
}