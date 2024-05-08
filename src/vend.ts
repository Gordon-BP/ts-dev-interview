#! /usr/bin/env node
const { nanoid } = await import('nanoid');
import { VendingMachine, VendingMachineActions, Product } from './vending_machine.js'; // Assuming transitions and VendingMachine are exported from another file
import { PubSub } from './pubsub.js'; // Your PubSub class
import inquirer from 'inquirer';

// Create a new PubSub instance
const pubSub = new PubSub();

const ui = new inquirer.ui.BottomBar();
// Create session ID and a topic
const sessionId = nanoid();
const topic = `session-${sessionId}`;

// Create a new vending machine with this session
const vendingMachine = new VendingMachine('Awaiting Selection');

pubSub.subscribe(topic, (input: string) => {
    vendingMachine.next(input);
});

async function askForAction() {
  try {
    const answers = await inquirer.prompt<VendingMachineActions>([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { name: "Select Product", value: "selectProduct" },
          { name: "Insert Money", value: "insertMoney" },
          { name: "Collect Item", value: "collectItem" },
          { name: "Cancel", value: "cancel" }
        ],
        when: vendingMachine.getCurrentState() === "Awaiting Selection",
      },
      {
        type: "list",
        name: "choices",
        message: "Choose a product:",
        choices: [
          {name: "Chips", value:"chips"},
          {name: "Soda", value:"soda"}
        ],
        when: (answers) => answers.action === "selectProduct",
      },
      {
        type: "input",
        name: "amount",
        message: "How much money are you inserting?",
        when: (answers) => answers.action === "insertMoney",
        validate: (value) => {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? "Please enter a valid number" : true;
        },
      },
    ]);
    console.log(answers)
    if (answers.product) {
      const [name, price] = answers.product.split(",");
      vendingMachine.selectProduct({ name, price: parseFloat(price) });
    } else if (answers.amount) {
      vendingMachine.insertMoney(parseFloat(answers.amount));
    } else if (answers.action === "collectItem") {
      vendingMachine.collectItem();
    } else if (answers.action === "selectProduct") {
      vendingMachine.collectItem();
    } else if (answers.action === "cancel") {
      vendingMachine.next("cancel");
    }
    else{
      console.log('Unknown answers: ', answers)
    }

    if (vendingMachine.getCurrentState() === "Awaiting Selection") {
      console.log("Transaction complete or cancelled.");
    } else {
      askForAction(); // Continue the loop
    }
  } catch (error) {
    console.error("Error with the inquirer prompt:", error);
  }
}

askForAction(); // Start the interaction loop
