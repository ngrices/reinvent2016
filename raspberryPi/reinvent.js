var awsIot = require('aws-iot-device-sdk');
var dateFormat = require('dateformat');
var format = "yyyy-mm-dd h:MM:ss";
var wpi = require('wiring-pi');

var thingName = 'lamp';
var thingShadows = awsIot.thingShadow({
   keyPath: '/home/pi/iot/deviceSDK/certs/fb8c7b6aac-private.pem.key',
  certPath: '/home/pi/iot/deviceSDK/certs/fb8c7b6aac-certificate.pem.crt',
    caPath: '/home/pi/iot/deviceSDK/certs/root-CA.crt',
  clientId: myThingName,
    region: 'us-east-1'
});

wpi.setup('wpi');
wpi.pinMode(25, wpi.OUTPUT);

thingShadows.on('connect', function() {

  log('Connected...');
  // register for updates
  thingShadows.register( thingName );
  log('Registering for state updates on [' + thingName + ']');

  // register for foreignStateChange event
  thingShadows.on('foreignStateChange', function(thing, operation, stateObject){
	  log('Message received on device: ' + thing );
	  log('Alexa skill has changed reported state to ' + JSON.stringify(stateObject.state.reported));
   
    if(stateObject.state.reported.lamp === 'on'){ 
      wpi.digitalWrite(25, 1); // write high voltage to pin 25
    } else if ( stateObject.state.reported.lamp === 'off'){
      wpi.digitalWrite(25, 0); // write low voltage to ping 25
    }
  });

  /**
   * Boiler plate handlers for all other event types
   */
  thingShadows.on('message', function(topic, payload){
	  console.log('message', topic, payload);
  });

  // Code below just logs messages for info/debugging
  thingShadows.on('status',
    function(thingName, stat, clientToken, stateObject) {
       console.log('received '+stat+' on '+thingName+': '+
                   JSON.stringify(stateObject));
    });

  thingShadows.on('update',
      function(thingName, stateObject) {
         console.log('received update '+' on '+thingName+': '+
                     JSON.stringify(stateObject));
      });

  thingShadows.on('delta',
      function(thingName, stateObject) {
         console.log('received delta '+' on '+thingName+': '+
                     JSON.stringify(stateObject));
      });

  thingShadows.on('timeout',
      function(thingName, clientToken) {
         console.log('received timeout for '+ clientToken)
      });

  thingShadows
    .on('close', function() {
      console.log('close');
    });
  thingShadows
    .on('reconnect', function() {
      console.log('reconnect');
    });
  thingShadows
    .on('offline', function() {
      console.log('offline');
    });
  thingShadows
    .on('error', function(error) {
      console.log('error', error);
    });

});

function log(msg) {
  var now = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");
  console.log('[' + now + '] ' + msg);
}
