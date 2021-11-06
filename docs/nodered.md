# Node Red

## How it works

On the server I keep a list with spotify URI's tied to tag numbers. When node red boots up it loads this into a flow variable for later usage.
When a tag is detected, the rasberry pi publishes the ID to an MQTT topic for the node red implementation to read.

This tag ID is then compared to the list and the URI is sent to the audio receiver with a command to play.

In line with the theme of learning, I wrote a custom component to select the album. However, if you'd rather implement natively, you can adapt the flows I'll walkthrough for unlocking the table.

## Unlocking the table

There is also a special tag ID that unlocks the table for maintenance. This uses similar logic to the music tags.

### Loading the tag file

|![Load](images/loadtags.png?raw=true "Load Tag Flow")|
|:--:|
| <b>The flow to load the tag table</b> |

```json
[{"id":"d0249aa5.14afc8","type":"inject","z":"152554cc.389edb","name":"","props":[{"p":"payload","v":"Started!","vt":"str"},{"p":"topic","v":"","vt":"string"}],"repeat":"","crontab":"","once":true,"onceDelay":"","topic":"","payload":"Started!","payloadType":"str","x":200,"y":120,"wires":[["f11098a2.4b88f8","464e3e5d.1a4b5"]]},{"id":"f11098a2.4b88f8","type":"change","z":"152554cc.389edb","name":"Flush tags","rules":[{"t":"delete","p":"Tags","pt":"global"}],"action":"","property":"","from":"","to":"","reg":false,"x":410,"y":160,"wires":[["28d375f9.d4d47a"]]},{"id":"464e3e5d.1a4b5","type":"function","z":"152554cc.389edb","name":"Clear","func":"flow.set(\"current_tag\", 0);","outputs":0,"noerr":0,"x":390,"y":100,"wires":[]},{"id":"28d375f9.d4d47a","type":"function","z":"152554cc.389edb","name":"Reset Index","func":"global.set(\"tag_count\", 0)\nglobal.set(\"spotify_tag_count\", 0)\nreturn msg;","outputs":1,"noerr":0,"x":590,"y":160,"wires":[["e011d35a.1d8b1"]]},{"id":"e011d35a.1d8b1","type":"file in","z":"152554cc.389edb","name":"Read Access Tags","filename":"/share/authorized_tags","format":"lines","chunk":false,"sendError":false,"encoding":"utf8","x":830,"y":80,"wires":[["48d45ac0.ec5f84"]]},{"id":"48d45ac0.ec5f84","type":"string","z":"152554cc.389edb","name":"strip","methods":[{"name":"trim","params":[]}],"prop":"payload","propout":"payload","object":"msg","objectout":"msg","x":990,"y":80,"wires":[["6f4b6a83.b251e4"]]},{"id":"6f4b6a83.b251e4","type":"function","z":"152554cc.389edb","name":"Load into global","func":"var count=global.get('tag_count') || 0;\n\nif (global.tag_count===undefined)//test exists\n{\n  global.tag_count=0;\n}\n\nglobal.set(\"Tags[\"+count+\"]\", msg.payload);\nglobal.set('tag_count', count + 1);\n\nmsg.payload = count\n\nreturn msg;","outputs":1,"noerr":0,"x":1140,"y":80,"wires":[[]]}]
```

In this example we're loading a flat file for the authorized tags. THis file resides on the server, not the device.

### Tag received flow

|![Handle](images/handletag.png?raw=true "Handle Tag Flow")|
|:--:|
| <b>The flow to handle the incomming tags</b> |

```json
[{"id":"3585a77d.6fe258","type":"mqtt out","z":"152554cc.389edb","name":"Publish","topic":"","qos":"0","retain":"false","broker":"2eafe4c0.b7da5c","x":980,"y":300,"wires":[]},{"id":"d82b898d.8d2e48","type":"mqtt in","z":"152554cc.389edb","name":"tags","topic":"coffee_table/tags","qos":"0","datatype":"auto","broker":"2eafe4c0.b7da5c","x":190,"y":300,"wires":[["aa02c509.209398"]]},{"id":"bba7a822.6dd958","type":"stoptimer","z":"152554cc.389edb","duration":"5","units":"Second","payloadtype":"num","payloadval":"lock","name":"","x":680,"y":260,"wires":[["a8851025.063b3"],[]]},{"id":"45f0144b.39d25c","type":"switch","z":"152554cc.389edb","name":"Check","property":"unlock","propertyType":"msg","rules":[{"t":"true"},{"t":"false"}],"checkall":"true","repair":false,"outputs":2,"x":490,"y":300,"wires":[["bba7a822.6dd958","3678f3ed.0183bc"],[]]},{"id":"3678f3ed.0183bc","type":"function","z":"152554cc.389edb","name":"unlock","func":"msg.topic = \"coffee_table/command\"\nmsg.payload = \"unlock\"\nreturn msg;","outputs":1,"noerr":0,"x":770,"y":300,"wires":[["3585a77d.6fe258"]]},{"id":"a8851025.063b3","type":"function","z":"152554cc.389edb","name":"Lock","func":"msg.topic = \"coffee_table/command\"\nmsg.payload = \"lock\"\nreturn msg;","outputs":1,"noerr":0,"x":850,"y":260,"wires":[["3585a77d.6fe258"]]},{"id":"cb1f7bed.cb9da8","type":"inject","z":"152554cc.389edb","name":"","repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":680,"y":380,"wires":[["3678f3ed.0183bc"]]},{"id":"52d19d76.808bf4","type":"comment","z":"152554cc.389edb","name":"Handle Tag","info":"","x":170,"y":240,"wires":[]},{"id":"aa02c509.209398","type":"function","z":"152554cc.389edb","name":"Lock?","func":"var count=global.get('tag_count') || 0;\nvar tag;\n\nfor(i=0; i<count; i++)\n{\n    tag = global.get(\"Tags[\"+i+\"]\");\n    if (tag==msg.payload)\n    {\n        msg.unlock = true\n        return msg;\n    }\n}\nmsg.unlock = false\nreturn msg;","outputs":1,"noerr":0,"x":330,"y":300,"wires":[["45f0144b.39d25c"]]},{"id":"2eafe4c0.b7da5c","type":"mqtt-broker","name":"hassio","broker":"192.168.1.32","port":"10883","clientid":"node_red","usetls":false,"compatmode":true,"keepalive":"60","cleansession":true,"birthTopic":"","birthQos":"0","birthPayload":"","closeTopic":"","closeQos":"0","closePayload":"","willTopic":"","willQos":"0","willPayload":""}]
```

Basically we check if it's in our list of authorized tags and then send the unlock command to the table. There's also a delay before sending the lock command.
Die to the mechanism of the lock, we don't want or need to hold it unlocked for long, just enough for the user to open the lid.

And that's pretty much it. For the albums there's a bit more logic to handle the spotify stuff.

### Album Tags

For the albums, I've used the following format:

```json
{
  "Tags":
  [
    {"tag":"0000005200",  "type":"playlist",  "uri": "spotify:playlist:4KZzgqldtfgFhfu82RsUvb", "name":"Throwing Copper"},
    {"tag":"0010154676",  "type":"playlist",  "uri": "spotify:album:7xl50xr9NDkd3i2kBbzsNZ", "name": "Stadium Arcadium"},
    {"tag":"0002697902",  "type":"playlist",  "uri": "spotify:album:3zNi5dCpkbm4zv7h1vGOMy", "name": "Djesse vol2"},
    {"tag":"0010188239",  "type":"playlist",  "uri": "spotify:album:5l5m1hnH4punS1GQXgEi3T", "name": "Lateralus"}
  ]
}
```

And the flow, using the custom component looks like so:

|![Play](images/play.png?raw=true "Play Tag Flow")|
|:--:|
| <b>The flow to play the correct album</b> |

```json
[{"id":"a2c76ab5.966668","type":"change","z":"152554cc.389edb","name":"","rules":[{"t":"delete","p":"payload","pt":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":419,"y":1981,"wires":[["22e23120.3afb9e","41cf0984.925558"]]},{"id":"22e23120.3afb9e","type":"api-call-service","z":"152554cc.389edb","name":"Select Source","server":"7d575fd3.be153","version":3,"debugenabled":false,"service_domain":"media_player","service":"select_source","entityId":"media_player.spotify_phil","data":"{\"source\":\"Onkyo TX-NR575E F3F71F\"}","dataType":"json","mergecontext":"","mustacheAltTags":false,"outputProperties":[],"queue":"none","x":669,"y":1961,"wires":[[]]},{"id":"cf41b9b3.0990f8","type":"album-picker","z":"152554cc.389edb","name":"Coffee Table","broker":"2eafe4c0.b7da5c","qos":"0","topic":"coffee_table/tags","path":"/share/music_tags.json","x":210,"y":1900,"wires":[["a2c76ab5.966668","8048bee3.1bf02"]]},{"id":"eba74ce6.1d2f6","type":"api-call-service","z":"152554cc.389edb","name":"Play Music","server":"7d575fd3.be153","version":3,"service_domain":"media_player","service":"play_media","entityId":"media_player.spotify_phil","data":"","dataType":"json","mergecontext":"","mustacheAltTags":false,"outputProperties":[],"queue":"none","x":659,"y":1881,"wires":[[]]},{"id":"41cf0984.925558","type":"api-call-service","z":"152554cc.389edb","name":"Select Net","server":"7d575fd3.be153","version":3,"debugenabled":false,"service_domain":"media_player","service":"select_source","entityId":"media_player.receiver","data":"{\"source\": \"net\"}","dataType":"json","mergecontext":"","mustacheAltTags":false,"outputProperties":[],"queue":"none","x":659,"y":2021,"wires":[[]]},{"id":"8048bee3.1bf02","type":"delay","z":"152554cc.389edb","name":"","pauseType":"delay","timeout":"600","timeoutUnits":"milliseconds","rate":"1","nbRateUnits":"1","rateUnits":"second","randomFirst":"1","randomLast":"5","randomUnits":"seconds","drop":false,"x":419,"y":1881,"wires":[["eba74ce6.1d2f6"]]},{"id":"7d575fd3.be153","type":"server","name":"Home Assistant","version":1,"legacy":false,"rejectUnauthorizedCerts":true,"ha_boolean":"y|yes|true|on|home|open","connectionDelay":true,"cacheJson":true},{"id":"2eafe4c0.b7da5c","type":"mqtt-broker","name":"hassio","broker":"192.168.1.32","port":"10883","clientid":"node_red","usetls":false,"compatmode":true,"keepalive":"60","cleansession":true,"birthTopic":"","birthQos":"0","birthPayload":"","closeTopic":"","closeQos":"0","closePayload":"","willTopic":"","willQos":"0","willPayload":""}]
```

I'm using the spotify component to play the album and have configure the receiver in home assistant as a media player. This greatly simplifies things and lets me use the HA abstractions.

## Custom Component

You can view the custom component and it's source [here](https://flows.nodered.org/node/node-red-contrib-nook-rfid-album-picker)

## Other Inputs

As well as the RFID tag reader, there are a number of buttons and encoders that can do things...

Because it appears as a collection of sensors in home assistant, you can use it for anything.

Some of the stuff I've got it doing are:
- adjust lights
- adjust colume
- adjust thermostat
- Play/Pause netflix/spotify
- Set mood lighting
- Skip tracks
- and so on...

|![Other](images/otherflows.png?raw=true "Other flows")|
|:--:|
| <b>Like any other sensor</b> |
