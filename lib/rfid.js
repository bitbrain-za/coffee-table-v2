const HID = require('node-hid');
const EventEmitter = require('events').EventEmitter;

module.exports = () =>
{
    const devices = HID.devices();
    const emitter = new EventEmitter();

    console.log(devices);

    const device = new HID.HID( '/dev/hidraw0' );

    let tag = "";
    let shift = false;

    const hid = { 4: 'a', 5: 'b', 6: 'c', 7: 'd', 8: 'e', 9: 'f', 10: 'g', 11: 'h', 12: 'i', 13: 'j', 14: 'k', 15: 'l', 16: 'm', 17: 'n', 18: 'o', 19: 'p', 20: 'q', 21: 'r', 22: 's', 23: 't', 24: 'u', 25: 'v', 26: 'w', 27: 'x', 28: 'y', 29: 'z', 30: '1', 31: '2', 32: '3', 33: '4', 34: '5', 35: '6', 36: '7', 37: '8', 38: '9', 39: '0', 44: ' ', 45: '-', 46: '=', 47: '[', 48: ']', 49: '\\', 51: ';' , 52: '\'', 53: '~', 54: ',', 55: '.', 56: '/'  }
    const hid2 = { 4: 'A', 5: 'B', 6: 'C', 7: 'D', 8: 'E', 9: 'F', 10: 'G', 11: 'H', 12: 'I', 13: 'J', 14: 'K', 15: 'L', 16: 'M', 17: 'N', 18: 'O', 19: 'P', 20: 'Q', 21: 'R', 22: 'S', 23: 'T', 24: 'U', 25: 'V', 26: 'W', 27: 'X', 28: 'Y', 29: 'Z', 30: '!', 31: '@', 32: '#', 33: '$', 34: '%', 35: '^', 36: '&', 37: '*', 38: '(', 39: ')', 44: ' ', 45: '_', 46: '+', 47: '{', 48: '}', 49: '|', 51: ':' , 52: '"', 53: '~', 54: '<', 55: '>', 56: '?'  }

    device.on("data", data => {
        emitter.emit("debug", data);
        if(8 != data.length)
        {
            emitter.emit('error', 'Invalid number of bytes received');
            return;
        }

        arr = [...data];
        arr.forEach(c => {
        if(40 == c) 
        {
            emitter.emit('tag', tag);
            tag = "";
            return;
        }
        else
        {
            if(shift)
            {
                if(2 == c)
                {
                    shift = true;
                }
                else
                {
                    if(c in hid2)
                    {
                        tag += hid2[c];
                    }
                    shift = false;
                }

            }
            else
            {
                if(2 == c)
                {
                    shift = true;
                }
                else
                {
                    if(c in hid)
                    {
                        tag += hid[c];
                    }
                }
            }
        }
        });
    });

    return emitter;
}