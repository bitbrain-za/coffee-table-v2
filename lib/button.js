const EventEmitter = require('events').EventEmitter;
const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO


module.exports = (gpio, debounce = 100, double_click_time = 500) =>
{
    const emitter = new EventEmitter();
    
    var timing = false;
    var timer;
    var button = new Gpio(gpio, 'in', 'both', {debounceTimeout: debounce});

    button.watch((err, val) =>
    { 
        if (err) 
        { 
            emitter.emit('error', err);
            return;
        }
        if(timing)
        {
            emitter.emit('click', 'double')
            timing = false;
            clearTimeout(timer);
        }
        else
        {
            timing = true;
            timer = setTimeout(() => 
            { 
                timing = false; 
                emitter.emit('click', 'single')
            }, doubleTime);
        }
    });

    return emitter;
}