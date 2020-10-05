# coffee-table-v2

Coffee table controls based on raspberry pi.

Includes a bunch of buttons and rotary encoders plus a strip of WS2812 leds.

## Features

lots of lovely things.

## Configuration

There are two configuration files, one for MQTT and one for the rest.
The MQTT can be configure over the web interface at port 3000.

The rest of the hardware configuration is in config/config.json.

TO configure pullups on the pi, edit the dt overlay in /boot/config.txt

https://www.npmjs.com/package/onoff#using-the-gpio-command-in-bootconfigtxt

## Home Assistant Integration

The controls are discoverable over MQTT.

## Special Controls

To speed things up with my receiver, there is an encoder type called volume.
This allows the controller to bypass the HA interface and talk directly to the receiver, cutting down the lag.
