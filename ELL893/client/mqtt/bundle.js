(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*
 * Copyright 2015-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

/*
 * NOTE: You must set the following string constants prior to running this
 * example application.
 */
var awsConfiguration = {
   // us-west-2:f84c9993-c267-4a37-a91b-7323e9e971aa
   poolId: 'us-west-2:1a37c4c8-6d20-406b-a444-93d488db9861', // 'YourCognitoIdentityPoolId'
   host: 'aaojr6mt4fsw4-ats.iot.us-west-2.amazonaws.com', // 'YourAwsIoTEndpoint', e.g. 'prefix.iot.us-east-1.amazonaws.com'
   region: 'us-west-2' // 'YourAwsRegion', e.g. 'us-east-1'
};
module.exports = awsConfiguration;


},{}],2:[function(require,module,exports){
/*
 * Copyright 2015-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

//
// Instantiate the AWS SDK and configuration objects.  The AWS SDK for 
// JavaScript (aws-sdk) is used for Cognito Identity/Authentication, and 
// the AWS IoT SDK for JavaScript (aws-iot-device-sdk) is used for the
// WebSocket connection to AWS IoT and device shadow APIs.
// 
var AWS = require('aws-sdk');
var AWSIoTData = require('aws-iot-device-sdk');
var AWSConfiguration = require('./aws-configuration.js');

console.log('Loaded AWS SDK for JavaScript and AWS IoT SDK for Node.js');

//
// Remember our current subscription topic here.
//
var currentlySubscribedTopic = 'ELL893/muneeb_majid/smarthome/mqtt/+';

//
// Remember our message history here.
//
var messageHistory = '';

//
// Create a client id to use when connecting to AWS IoT.
//
var clientId = 'mqtt-explorer-' + (Math.floor((Math.random() * 100000) + 1));

//
// Initialize our configuration.
//
AWS.config.region = AWSConfiguration.region;

AWS.config.credentials = new AWS.CognitoIdentityCredentials({
   IdentityPoolId: AWSConfiguration.poolId
});

//
// Create the AWS IoT device object.  Note that the credentials must be 
// initialized with empty strings; when we successfully authenticate to
// the Cognito Identity Pool, the credentials will be dynamically updated.
//
const mqttClient = AWSIoTData.device({
   //
   // Set the AWS region we will operate in.
   //
   region: AWS.config.region,
   //
   ////Set the AWS IoT Host Endpoint
   host:AWSConfiguration.host,
   //
   // Use the clientId created earlier.
   //
   clientId: clientId,
   //
   // Connect via secure WebSocket
   //
   protocol: 'wss',
   //
   // Set the maximum reconnect time to 8 seconds; this is a browser application
   // so we don't want to leave the user waiting too long for reconnection after
   // re-connecting to the network/re-opening their laptop/etc...
   //
   maximumReconnectTimeMs: 8000,
   //
   // Enable console debugging information (optional)
   //
   debug: true,
   //
   // IMPORTANT: the AWS access key ID, secret key, and sesion token must be 
   // initialized with empty strings.
   //
   accessKeyId: '',
   secretKey: '',
   sessionToken: ''
});

//
// Attempt to authenticate to the Cognito Identity Pool.  Note that this
// example only supports use of a pool which allows unauthenticated 
// identities.
//
var cognitoIdentity = new AWS.CognitoIdentity();
AWS.config.credentials.get(function(err, data) {
   if (!err) {
      console.log('retrieved identity: ' + AWS.config.credentials.identityId);
      var messageTopublish = 'retrieved identity: ' + AWS.config.credentials.identityId;
      var finalMessage = JSON.stringify(messageTopublish)
      mqttClient.publish('ELL893/muneeb_majid/smarthome/mqtt/connection', finalMessage);
      var params = {
         IdentityId: AWS.config.credentials.identityId
      };
      cognitoIdentity.getCredentialsForIdentity(params, function(err, data) {
         if (!err) {
            //
            // Update our latest AWS credentials; the MQTT client will use these
            // during its next reconnect attempt.
            //
            mqttClient.updateWebSocketCredentials(data.Credentials.AccessKeyId,
               data.Credentials.SecretKey,
               data.Credentials.SessionToken);
            console.log("AccessKeyId :" + data.Credentials.AccessKeyId)
            console.log ("SecretKey: " + data.Credentials.SecretKey)
            console.log("SessionToken: " + data.Credentials.SessionToken)
         } else {
            console.log('error retrieving credentials: ' + err);
            var messageTopublish = 'error retrieving credentials: ' + err;
            var finalMessage = JSON.stringify(messageTopublish)
            mqttClient.publish('ELL893/muneeb_majid/smarthome/mqtt/connection', finalMessage);
            alert('error retrieving credentials: ' + err);
         }
      });
   } else {
      console.log('error retrieving identity:' + err);
      var messageTopublish = 'error retrieving credentials: ' + err;
      var finalMessage = JSON.stringify(messageTopublish)
      mqttClient.publish('ELL893/muneeb_majid/smarthome/mqtt/connection', finalMessage);
      alert('error retrieving identity: ' + err);
   }
});

//
// Connect handler; update div visibility and fetch latest shadow documents.
// Subscribe to lifecycle events on the first connect event.
//
window.mqttClientConnectHandler = function() {
   console.log('Client UI App connected to AWS IoT');
   var messageTopublish = 'Client UI App connected to AWS IoT';
   var finalMessage = JSON.stringify(messageTopublish)
   mqttClient.publish('ELL893/muneeb_majid/smarthome/mqtt/connection', finalMessage);
   document.getElementById("connecting-div").style.visibility = 'hidden';
   document.getElementById("explorer-div").style.visibility = 'visible';
   document.getElementById('subscribe-div').innerHTML = '<p><br></p>';
   messageHistory = '';

   //
   // Subscribe to our current topic.
   //
   mqttClient.subscribe(currentlySubscribedTopic);
};

//
// Reconnect handler; update div visibility.
//
window.mqttClientReconnectHandler = function() {
   console.log('reconnect');
   var messageTopublish = 'reconnect';
   var finalMessage = JSON.stringify(messageTopublish)
   mqttClient.publish('ELL893/muneeb_majid/smarthome/mqtt/connection', finalMessage);
   document.getElementById("connecting-div").style.visibility = 'visible';
   document.getElementById("explorer-div").style.visibility = 'hidden';
};

//
// Utility function to determine if a value has been defined.
//
window.isUndefined = function(value) {
   return typeof value === 'undefined' || typeof value === null;
};

//
// Message handler for lifecycle events; create/destroy divs as clients
// connect/disconnect.
//
window.mqttClientMessageHandler = function(topic, payload) {
   // var receivedMessage = JSON.parse(payload);
   console.log('message: ' + topic + ':' + payload.toString());
   messageHistory = messageHistory + topic + ':' + payload.toString() + '</br>';
   document.getElementById('subscribe-div').innerHTML = '<p>' + messageHistory + '</p>';
};

//
// Handle the UI for the current topic subscription
//
window.updateSubscriptionTopic = function() {
   var subscribeTopic = document.getElementById('subscribe-topic').value;
   document.getElementById('subscribe-div').innerHTML = '';
   mqttClient.unsubscribe(currentlySubscribedTopic);
   currentlySubscribedTopic = subscribeTopic;
   mqttClient.subscribe(currentlySubscribedTopic);
};

//
// Handle the UI to clear the history window
//
window.clearHistory = function() {
   if (confirm('Delete message history?') === true) {
      document.getElementById('subscribe-div').innerHTML = '<p><br></p>';
      messageHistory = '';
   }
};

//
// Handle the UI to update the topic we're publishing on
//
window.updatePublishTopic = function() {};

//
// Handle the UI to update the data we're publishing for smart_bulb1
//
window.updatePublishData_smart_bulb1 = function() {
   var publishText = document.getElementById('publish-data').checked;
   var colorText = document.getElementById('color_change').value;
   var bulb1_device_power = document.getElementById('smart_bulb1_device_power').checked;
   var messageTopublish = {device: "smart_bulb1",device_power: bulb1_device_power, params : {power: publishText, color: colorText}}
   var publishTopic = "ELL893/muneeb_majid/smarthome/mqtt/smart_bulb1";
   if(messageTopublish.params.power == false)
   {
      document.getElementById("color_change").disabled = true;
   }else{
      document.getElementById("color_change").disabled = false;
   }
   var finalMessage = JSON.stringify(messageTopublish)
   mqttClient.publish(publishTopic, finalMessage);
};

//
// Handle the UI to update the data we're publishing for smart_ac1
//
window.updatePublishData_smart_ac1 = function() {
   var ac_power = document.getElementById('smart_ac1_power').checked;
   var ac_h_direction = document.getElementById('smart_ac1_h_direction').value;
   var ac_temperature = document.getElementById('smart_ac1_temperature').value;
   if (ac_h_direction == '0'){
      ac_h_direction = "rotate(-45deg)";
   }else if (ac_h_direction == '1'){
      ac_h_direction = "rotate(0deg)";
   }else{
      ac_h_direction = "rotate(45deg)";
   }
   var publishTopic = "ELL893/muneeb_majid/smarthome/mqtt/smart_ac1";
   var messageTopublish = {device: "smart_ac1", params : {power: ac_power, h_direction: ac_h_direction, temperature: ac_temperature}}
   if(messageTopublish.params.power == false)
   {
      document.getElementById("smart_ac1_h_direction").disabled = true;
      document.getElementById("smart_ac1_temperature").disabled = true;
   }else{
      document.getElementById("smart_ac1_h_direction").disabled = false;
      document.getElementById("smart_ac1_temperature").disabled = false;
   }
   var finalMessage = JSON.stringify(messageTopublish)
   mqttClient.publish(publishTopic, finalMessage);
   
};

//
// Handle the UI to update the data we're publishing for smart_fan1
//
window.updatePublishData_smart_fan1 = function() {
   var fan_status = document.getElementById('smart_fan1_power').checked;
   var fan_device_power = document.getElementById('smart_fan1_device_power').checked;
   var publishTopic = "ELL893/muneeb_majid/smarthome/mqtt/smart_fan1";
   var messageTopublish = {device: "smart_fan1",device_power: fan_device_power,params : {power: fan_status}}
   if(messageTopublish.params.device_power == false)
   {
      document.getElementById("smart_fan1_power").disabled = true;
   }else{
      document.getElementById("smart_fan1_power").disabled = false;
   }
   var finalMessage = JSON.stringify(messageTopublish)
   mqttClient.publish(publishTopic, finalMessage);
  
};

//
// Handle the UI to update the data we're publishing for smart_lock1
//
window.updatePublishData_smart_lock1 = function() {
   var smart_lock_power = document.getElementById('smart_lock1_power').checked;
   var smart_lock_status = document.getElementById('smart_lock1_door_status').value;
   // var colorText = document.getElementById('color_change').value;
   var publishTopic = "ELL893/muneeb_majid/smarthome/mqtt/smart_lock1";
   var messageTopublish = {device: "smart_lock1", params : {power: smart_lock_power, door_status: smart_lock_status}}
   if(messageTopublish.params.power == false)
   {
      document.getElementById("smart_lock1_door_status").disabled = true;
   }else{
      document.getElementById("smart_lock1_door_status").disabled = false;
   }
   var finalMessage = JSON.stringify(messageTopublish)
   mqttClient.publish(publishTopic, finalMessage);
};

//
// Install connect/reconnect event handlers.
//
mqttClient.on('connect', window.mqttClientConnectHandler);
mqttClient.on('reconnect', window.mqttClientReconnectHandler);
mqttClient.on('message', window.mqttClientMessageHandler);

//
// Initialize divs.
//
document.getElementById('connecting-div').style.visibility = 'visible';
document.getElementById('explorer-div').style.visibility = 'hidden';
document.getElementById('connecting-div').innerHTML = '<p>attempting to connect to aws iot...</p>';

},{"./aws-configuration.js":1,"aws-iot-device-sdk":"aws-iot-device-sdk","aws-sdk":"aws-sdk"}]},{},[2]);
