#!/usr/bin/env node
const { nanoid } = await import('nanoid');
import { VendingMachine, State } from './vending_machine.js'; // Ensure this includes all needed exports
import { PubSub } from './pubsub.js'; // Your PubSub class
import inquirer from 'inquirer';

// Create a new PubSub instance
const pubSub = new PubSub();

// Create session ID and a topic
const sessionId = nanoid();
const topic = sessionId;

pubSub.subscribe(topic, (data: any) => {
  console.log("RECEIVED DATA: ", data);
  let state = "Start";
  state = data && data.state ? data.state : state;
  const vendingMachine = new VendingMachine(sessionId, state as State);
  console.log("processing action...");
  let action = data && data.action ? data.action : "next";
  let d = vendingMachine.next(action)
  console.log("AAAAA")
  console.log(d)
  askForAction(d);
});

async function askForAction(data:any) {
    console.log("asking for action...")
    const response = await inquirer.prompt([{
        type: data.promptType ? data.promptType : 'input',
        name: 'response',
        message: data.message ? data.message : 'Enter an action:',
        choices: data.choices ? data.choices : [],
        validate: data.validate ? data.validate : true,
    }]);

    // Publish the response back to the VendingMachine for processing
    pubSub.publish(topic, { state: response.response });
}

function start_vending() {
    // Initial message to user when starting the vending machine
    console.log("publishing data from vend")
    pubSub.publish(topic, {
        state: "Awaiting Selection",
    });
}
// Function to send heartbeat messages
function startHeartbeat() {
  setInterval(() => {
      console.log("Sending heartbeat");
      pubSub.publish(topic, { action: 'heartbeat' });
  }, 30000); // Sends a heartbeat every 30 seconds
}
startHeartbeat() 
start_vending();