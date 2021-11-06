# Contents

The code is divided into a couple of categories:

- Hardware Interface
    - Inputs (buttons, encoders and RFID reader)
    - Output (LEDs, solenoids)
    - Configuration
- Home Assistant Integration (MQTT)
- Web Interface (express)

# Hardware

The idea here was to make the device configurable on the fly. If you want less buttons and more encoders, just modify the config file as you see fit.

Name the buttons and encoders however you want them to show up in Home Assistant and the code will take care of the rest. THe device is discoverable and will enumerate your inputs and lights. The topic is unique by MAC address so multiple units can be distuinguished in the same instance.

```json
{
    "RFID":
    {
        "topic": "test/tags"
    },

    "Encoder":
    [
        {
            "type": "generic",
            "Name": "Encoder1",
            "gpioA": 24, 
            "gpioB": 25,
            "min": 20,
            "max": 80,
            "step": 1,
            "initial": 0,
            "debounceTimeout": 10
        },
        {
            "type": "generic",
            "Name": "Encoder2",
            "gpioA": 5, 
            "gpioB": 12,
            "min": 0,
            "max": 255,
            "step": 1,
            "initial": 0,
            "debounceTimeout": 10
        },
        {
            "type": "generic",
            "Name": "Encoder3",
            "gpioA": 19, 
            "gpioB": 13,
            "min": 0,
            "max": 255,
            "step": 1,
            "initial": 0,
            "debounceTimeout": 10
        }
    ],

    "Button":
    [
        { "Name": "btnE1", "Pin": 23 },
        { "Name": "btnE2", "Pin": 6 },
        { "Name": "btnE3", "Pin": 16 },

        { "Name": "btn1", "Pin": 20 },
        { "Name": "btn2", "Pin": 26 },
        { "Name": "btn3", "Pin": 21 },
        { "Name": "btn4", "Pin": 17 },
        { "Name": "btn5", "Pin": 27 },
        { "Name": "btn6", "Pin": 22 },

        { "Name": "DOS", "Pin": 15 }
    ],

    "Lock": 4,

    "WS2812":{
        "Length": 55,
        "Pin": 18
    }
}
```

|![Home Assistant](images/ha.png?raw=true "Home Assistant Component")|
|:--:|
| <b>The component in Home Assistant (after renaming some of the buttons/encoders)</b> |

### LEDs

I've used the LEDs to show the status of the encoders and included a couple of fun effects.

### Web Interface

This was done using express. I am no web developer and pretty much copied examples for this bit. If anyone reading this wants to submit a PR, please do.