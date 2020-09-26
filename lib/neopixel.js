const ws281x = require('rpi-ws281x');
const colourWheel = require("./colour_wheel");
const randInt = require("./randInt")

module.exports = class Neopixel 
{
    constructor(leds = 32, gpio = 18) 
    {
        this.Mode = "none";
        this.RainbowOffset = 0;

        this.config = {};

        // Number of leds in my strip
        this.config.leds = leds;

        // Use DMA 10 (default 10)
        this.config.dma = 10;

        // Set full brightness, a value from 0 to 255 (default 255)
        this.config.brightness = 255;

        // Set the GPIO number to communicate with the Neopixel strip (default 18)
        this.config.gpio = gpio;

        // The RGB sequence may vary on some strips. Valid values
        // are "rgb", "rbg", "grb", "gbr", "bgr", "brg".
        // Default is "rgb".
        // RGBW strips are not currently supported.
        this.config.type = 'grb';

        // Configure ws281x
        ws281x.configure(this.config);
        this.map = new Uint32Array(this.config.leds);
    }

    renderMap()
    {
        ws281x.render(this.map);
    }

    setColour(red = 0, green = 0, blue = 0, render = true, duration = 0)
    {
        var temp = new Uint32Array(this.config.leds);

        var colour = (red << 16) | (green << 8)| blue;

        for (var i = 0; i < this.config.leds; i++)
            temp[i] = colour;

        if(duration == 0)
        {
            this.map = temp;
        }
        else
        {
            render = true;
            setTimeout(() => ws281x.render(this.map), duration);
        }

        if(render)
            ws281x.render(temp);
    }

    setPixel(pixel, red, green, blue, render = false)
    {
        var colour = (red << 16) | (green << 8)| blue;
        this.map[pixel] = colour;

        if(render)
        {
            this.renderMap();
        }
    }

    Rainbow(speed = 200, offset = 0)
    {
        this.Mode = "rainbow";
        this.RainbowOffset = offset;
        this._rainbow(speed);
        var temp = new Uint32Array(this.config.leds);
        for (var i = 0; i < this.config.leds; i++) 
        {
            temp[i] = colourWheel((this.RainbowOffset + i) % 256);
        }

        this.RainbowOffset = (this.RainbowOffset + 1) % 256;
        ws281x.render(temp);
    }

    _rainbow(speed)
    {
        setTimeout(() =>
        {
            if (this.Mode === "rainbow") 
            {
                this._rainbow(speed);
                var temp = new Uint32Array(this.config.leds);
                for (var i = 0; i < this.config.leds; i++) 
                {
                    temp[i] = colourWheel((this.RainbowOffset + i) % 256);
                }

                this.RainbowOffset = (this.RainbowOffset + 1) % 256;
                ws281x.render(temp);
            } 
            else
            {
                this.renderMap();
            }
        }, speed);
	}
    
    Fire(cooling = 55, sparking = 80, speed_delay = 20)
    {
        this.Mode = "fire";
        this.heat = new Array(this.config.leds).fill(0);
        this._fire(cooling, sparking, speed_delay);
    }

    _fire(cooling, sparking, speed_delay)
    {
        setTimeout( () =>
        {
            if(this.Mode == "fire")
            {
                this._fire(cooling, sparking, speed_delay);
                for (var i = 0; i < this.config.leds; i++) 
                {
                    var cooldown = randInt(0, ((cooling * 10)/this.config.leds) + 20);

                    if(cooldown > this.heat[i])
                        this.heat[i] = 0;
                    else
                        this.heat[i] -= cooldown;
                }

                for(var i = this.config.leds - 1; i > 3; --i)
                {
                    this.heat[i] = (this.heat[i - 1] + this.heat[i - 2] + this.heat[i - 2]) / 3
                }

                if (randInt(0, 255) < sparking)
                {
                    let y = randInt(0, 7);
                    this.heat[y] = this.heat[y] + randInt(160, 255)
                }

                var temp = new Uint32Array(this.config.leds);
                for (var i = 0; i < this.config.leds; i++) 
                {
                    temp[i] = this.setPixelHeat(i, this.heat[i]);
                }
                ws281x.render(temp);
            }
            else
            {
                this.renderMap();
            }
        }, speed_delay);

    }

    setPixelHeat(pixel, temperature, map)
    {
        let t192 = Math.round((temperature/255.0) * 191);
        let heatramp = t192 & 0x3F;

        if(t192 > 0x80)
		    return ((255 & 0xff) << 16) + ((255 & 0xff) << 8) + (heatramp & 0xff);
        else if(t192 > 0x40)
		    return ((255 & 0xff) << 16) + ((heatramp & 0xff) << 8) + (0 & 0xff);
        else 
		    return ((heatramp & 0xff) << 16) + ((0 & 0xff) << 8) + (0 & 0xff);
    }

    RunningLights(red = 0xFF, green = 0xFF, blue = 0xFF, delay = 50)
    {
        this.Mode = "running_lights"
        this.position = 0;
        this._running_lights(red, green, blue, delay);
    }

    _running_lights(red = 0xFF, green = 0xFF, blue = 0xFF, delay = 50)
    {
        setTimeout( () => 
        {
            if(this.Mode == "running_lights")
            {
                this._running_lights(red, green, blue, delay);
                var temp = new Uint32Array(this.config.leds);
                for(var i = 0 ; i < this.config.leds ; ++i)
                {
                    temp[i] = (((Math.sin(i + this.position) * 127 + 128)/255)*red << 16) +
                              (((Math.sin(i + this.position) * 127 + 128)/255)*green << 8) +
                              ((Math.sin(i + this.position) * 127 + 128)/255)*blue;
                }
                ++this.position;
                ws281x.render(temp);
            }
            else
            {
                this.renderMap();
            }
        }, delay);
    }
};
