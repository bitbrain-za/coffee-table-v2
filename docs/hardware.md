# The Hardware

## Components Used

- Raspberry Pi 3b+ and PSU
- 2 [Electromagnetic Cabinet Locks](https://www.aliexpress.com/item/1005001938251195.html)
- Strip of [WS2812b LEDs](https://www.aliexpress.com/item/1005003129921250.html)
- PSU for LEDs
- 3 [Rotary encoders](https://www.aliexpress.com/item/1005002931777351.html)
- 6 [Micro switches](https://www.aliexpress.com/item/32878542627.html)
- ATTiny85 USB dev board
- IR LED
- Microswitch to detect lid open
- [125KHz RFID Reader](https://www.banggood.com/125KHZ-USB-RFID-EM4100-ID-Card-Reader-or-Door-Access-Control-System-Waterproof-Fast-Response-p-1290348.html)

## Assembled

|![Hardware](images/electronics.jpg?raw=true "Electronics")|
|:--:|
| <b>The electronics in place</b> |

## Connections

The code allows for configuring the pins at runtime so it doesn't really matter.

## The IR stuff

There's an ATTiny85 and IR LED used to emulate a remote control. This was done in the first revision of the code but deprecated in this version as the angle in my room makes it unreliable. The idea was to be able to emulate the controls for the audio receiver using this but there's another way that will be discussed in the code section.

## RFID Reader

I was going to recess this but testing showed it was able to pick up a card through the wood without problem so it's just screwed onto the underside. I would suggest testing yours beforehand.
Also, take a look at the surface before mounting the reader. Pick a feature on the wood and mount below this. I have a clear knot just on the otherside of this that makes it easy to place cards in the correct spot.
You could alternatively mark the surface if you so desired.