exports.handler = function(request, context) {
    switch (request.header.namespace) {
        case 'Alexa.ConnectedHome.Discovery':
            handleDiscovery(request, context);
            break;
        case 'Alexa.ConnectedHome.Control':
            handleControl(request, context);
            break;
        default:
            log('ERROR', 'No supported namespace: ' + request.header.namespace);
            /**
             * Respond with UnexpectedInformationReceivedError 
             */
            context.succeed( error('UnexpectedInformationReceivedError', {"faultingParameter": request.header.namespace}));
            break;
    }
};

function handleDiscovery(request, context) {

    var payload = {
        discoveredAppliances : [
            {
                "applianceId" : "demo-lamp",
                "manufacturerName" : "Alexa Smart Home Demo Company",
                "modelName" : "demo-lamp-1",
                "version": "1.0",
                "friendlyName": "lamp",
                "friendlyDescription": "IoT Connected RaspberryPi Lamp",
                "isReachable": true,
                "actions":                ["turnOn","turnOff"],    
                "additionalApplianceDetails" : {
                    "extraDetail1": "optionalDetailForSkillAdapterToReferenceThisDevice",
                    "extraDetail2": "There can be multiple entries",
                    "extraDetail3": "but they should only be used for reference purposes.",
                    "extraDetail4": "This is not a suitable place to maintain current device state"
                }
            }
        ]
    };
    var header = request.header;
    header.name = "DiscoverAppliancesResponse";
    log('DEBUG', 'Discovery Response: ' + JSON.stringify({header: header, payload: payload}));
    context.succeed({header: header,payload: payload});
}

function handleControl(request, context) {
    if(request.header.namespace != 'Alexa.ConnectedHome.Control'){
        context.succeed(error(header, 'UnexpectedInformationReceivedError', { 'faultingParameter': request.header.namespace}));
        return;
    }
    log('DEBUG', "This is a control command");
    if(APPLIANCE_CONTROLS.indexOf(request.header.name) == -1){
        context.succeed(error(header, 'UnexpectedInformationReceivedError', { 'faultingParameter': request.header.name}));
        return;
    }
    var applianceId = request.payload.appliance.applianceId;
    if (!applianceId){
        log('ERROR', 'No applianceId provided in request');
        context.succeed(response(request.header, 'UnexpectedInformationReceivedError', {'faultingParameter': request.payload.appliance.applianceId}));
        return;
    }
    switch(request.header.name){
        case 'TurnOnRequest':
            updateIoTDevice('on', function(response_name) {
                return context.succeed(response(request.header, response_name, {})); 
            });
            break;   
        case 'TurnOffRequest':
             updateIoTDevice('off', function(response_name) {
                return context.succeed(response(request.header, response_name, {})); 
            });
            break;  
        default: 
            break;
    }
}
/** 
 * The AWS SDK reference and IoT object
 */
var AWS = require("aws-sdk");
var iotdata = new AWS.IotData({
    endpoint: 'a29s9eowxgq16k.iot.us-east-1.amazonaws.com'.toLowerCase()
});
/**
 * updateIoTDevice
 */
function updateIoTDevice(state,callback) {
        var params = {
            thingName: 'lamp',
            payload: '{ "state" : { "desired" : null, "reported" : { "lamp" : "' + state + '" }}}'
        };
        // updateThingShadow function in iotdata
        iotdata.updateThingShadow(params, function(err, data) {
            if (err) { // an error occurred
                log('DEBUG', err);
                callback('DriverInternalError');
            } else { // successful response
                log('INFO', "Updating thing state on " + thingName + "!");
                log('INFO', JSON.stringify(data));
                if(state === 'on')
                    callback('TurnOnConfirmation');
                else  
                    callback('TurnOffConfirmation');
            }
        });
    
}
function log(level, msg) {
    console.log('[' + title + ']   -   ' + msg);
}
function response(_header, name, payload){
    var header = _header;
    header.name = name;
    return { header: header, payload: payload};
}
var APPLIANCE_CONTROLS = [
    'TurnOnRequest',
    'TurnOffRequest',
    'SetTargetTemperatureRequest',
    'IncrementTargetTemperatureRequest',
    'DecrementTargetTemperatureRequest',
    'SetPercentageRequest',
    'IncrementPercentageRequest',
    'DecrementPercentageRequest' 
    ];

