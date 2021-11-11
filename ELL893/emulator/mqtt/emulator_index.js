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
      // 'us-west-2:4b32e853-21c4-4ead-ba26-49cb25209e14'
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
             } else {
                console.log('error retrieving credentials: ' + err);
                alert('error retrieving credentials: ' + err);
             }
          });
       } else {
          console.log('error retrieving identity:' + err);
          alert('error retrieving identity: ' + err);
       }
    });
    
    //
    // Connect handler; update div visibility and fetch latest shadow documents.
    // Subscribe to lifecycle events on the first connect event.
    //
    window.mqttClientConnectHandler = function() {
       console.log('Emulator connected to AWS IoT');
       var messageTopublish = 'Emulator connected to AWS IoT';
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
       var receivedMessage = JSON.parse(payload)
       // Code to check if device is smart_bulb1
       if(receivedMessage.device == "smart_bulb1")
       {
         if(receivedMessage.device_power == true)
         {
            if (receivedMessage.params.power == true)
            {
               document.getElementById('livingroom').style.opacity = 0;
               document.getElementById('livingroomlamp').style.opacity = 0;
               document.getElementById('triangle-bottomright').style.opacity = 0;
               console.log('light turned on in living room')
            }else
            {
                  document.getElementById('livingroom').style.opacity = 0.8;
                  document.getElementById('triangle-bottomright').style.opacity = 0.8;
                  document.getElementById('livingroomlamp').style.opacity = 0.9;
                  document.getElementById('livingroom').style.background = "#000000";
                  document.getElementById('livingroomlamp').style.background = "#000000";
                  document.getElementById('triangle-bottomright').style.borderBottom = "474px #000000 solid";
                  console.log('light turned off in living room')
            }
            if(receivedMessage.params.color != "#000000" && receivedMessage.params.power != false)
            {
                  console.log("Reaching here")
                  document.getElementById('livingroom').style.background = receivedMessage.params.color;
                  console.log(receivedMessage.params.color)
                  console.log(receivedMessage.params.power)
                  document.getElementById('livingroomlamp').style.background = receivedMessage.params.color;
                  document.getElementById('triangle-bottomright').style.borderBottom = "474px " + receivedMessage.params.color + " solid";
                  console.log("Reaching and here here")
            }
         }
      }else if (receivedMessage.device == "smart_ac1")   // Code to check if device is smart_ac1
      {
        if(receivedMessage.params.power == true){
           document.getElementById('acair').style.transform = receivedMessage.params.h_direction;
           document.getElementById('acair').style.display = 'block';
           document.getElementById('temperature').textContent = receivedMessage.params.temperature;
           console.log('AC turned on in bedroom')
        }else{
           document.getElementById('acair').style.display = 'none';
           document.getElementById('temperature').textContent = '';
           console.log('AC turned off in bedroom')
        }
      }
      else if (receivedMessage.device == "smart_fan1")  // Code to control if device is smart_fan1
      {
         if(receivedMessage.device_power == true)
         {
            if(receivedMessage.params.power == true)
            {
               document.getElementById('fan').style.backgroundImage = "url(images/fanon.png)";
               console.log('Fan turned on in living room')
            }
            else
            {
               document.getElementById('fan').style.backgroundImage = "url(images/fanoff.png)";
               console.log('Fan turned off in living room')
            }
         }
      }
      else if (receivedMessage.device == "smart_lock1")  // Code to control if device is smart_lock1
      {
         if(receivedMessage.params.door_status == "unlocked")
         {
         	  document.getElementById('doorclose1').style.left= '269px';
            document.getElementById('doorclose1').style.top= '205px';
            document.getElementById('doorclose2').style.left= '258px';
            document.getElementById('doorclose2').style.top= '327px';
            console.log('door open')
         }else{
            document.getElementById('doorclose1').style.left= '264px';
            document.getElementById('doorclose1').style.top= '245px';
            document.getElementById('doorclose2').style.left= '260px';
            document.getElementById('doorclose2').style.top= '292px';
            console.log('door close')
         }
      }
      console.log('message: ' + topic + ':' + payload.toString());
    //    messageHistory = messageHistory + topic + ':' + payload.toString() + '</br>';
        var currentdate = new Date();
        var datetime = currentdate.getDate() + "/" + (currentdate.getMonth()+1) 
        + "/" + currentdate.getFullYear() + " @ " 
        + currentdate.getHours() + ":" 
        + currentdate.getMinutes() + ":" + currentdate.getSeconds();
       messageHistory = messageHistory + "[Time: " + datetime + '] ' + "[Message: "+ payload.toString() + "]" + '</br>';
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
    // Handle the UI to update the data we're publishing
    //
    window.updatePublishData = function() {
       var publishText = document.getElementById('publish-data').value;
       var publishTopic = document.getElementById('publish-topic').value;
       
       mqttClient.publish(publishTopic, publishText);
       document.getElementById('publish-data').value = '';
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
    document.getElementById('subscribe-div').style.visibility = 'visible';
    document.getElementById('connecting-div').style.visibility = 'visible';
    document.getElementById('explorer-div').style.visibility = 'hidden';
    document.getElementById('connecting-div').innerHTML = '<p>attempting to connect to aws iot...</p>';
    
    },{"./aws-configuration.js":1,"aws-iot-device-sdk":"aws-iot-device-sdk","aws-sdk":"aws-sdk"}]},{},[2]);
    