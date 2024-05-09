import { PubSub } from "./pubsub.js";
const { nanoid } = await import('nanoid');

export type State = 'Awaiting Selection' | 'Display Price' | 'Await Money' | 'Vending' | 'Collect Item';

export interface Product {
    name: string;
    price: number;
}

interface Transition {
    [key: string]: State;
}

interface StateMachineConfig {
    [key: string]: Transition;
}

export class VendingMachine {
    private currentState: State;
    private transitions: StateMachineConfig = {
        'Start':{
            next:'Awaiting Selection'
        },
        'Awaiting Selection': {
            next: 'Display Price'
        },
        'Display Price': {
            insertMoney: 'Await Money',
            cancel: 'Awaiting Selection'
        },
        'Await Money': {
            insertMoreMoney: 'Await Money',
            enoughMoney: 'Vending',
            cancel: 'Awaiting Selection'
        },
        'Vending': {
            next: 'Collect Item'
        },
        'Collect Item': {
            next: 'Awaiting Selection'
        }
    };
    private selectedProduct?: Product;
    private insertedMoney: number = 0;
    private sessionId: string;
    private pubSub: PubSub;

    constructor(sessionId: string, currentState:State) {
        this.sessionId = sessionId;
        this.pubSub = new PubSub();
        this.currentState = currentState;
        this.handleStateChange();
    }

    setState(newState: State) {
        this.currentState = newState;
        this.handleStateChange();
    }

    next(input: string) {
        
        input = input? input : "selectProduct"
        console.log("input is: ", input)
        return this.handleStateChange()
    }

    handleStateChange() {
        console.log("publishing data from vending machine to: ", this.sessionId, "with state ", this.currentState)
        switch (this.currentState) {
            case 'Awaiting Selection':
                return {
                    promptType: 'list',
                    message: 'Select an action:',
                    choices: ['Select Product', 'Insert Money', 'Collect Item', 'Cancel']
                };
            case 'Display Price':
                return{
                    promptType: 'input',
                    message: 'Enter the amount of money:',
                    validate: (input: string) => parseFloat(input) ? true : "Please enter a valid number."
                }
            case 'Await Money':
                return {
                    promptType: 'input',
                    message: 'How much more money to insert?',
                    validate: (input: string) => {
                        const value = parseFloat(input);
                        return (value > 0 && value <= 10) ? true : "Enter a valid amount between $0 and $10.";
                    }
                }
            case 'Vending':
                setTimeout(() => {
                    this.setState('Collect Item');
                }, 5000);  // Simulates a 5-second delay for vending
                return{
                    message: 'Thank you! Please collect your item.'
                }
        }
    }

    getCurrentState(): State {
        return this.currentState;
    }
}

export type VendingMachineActions = {
    action?: 'selectProduct' | 'insertMoney' | 'collectItem' | 'cancel';
    product?: string;
    amount?: string;
};
