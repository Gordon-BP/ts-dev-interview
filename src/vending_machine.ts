import { publishMessage } from "./utils.js";
const { nanoid } = await import('nanoid');

type State = 'Awaiting Selection' | 'Display Price' | 'Await Money' | 'Vending' | 'Collect Item';

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
        'Awaiting Selection': {
            selectProduct: 'Display Price'
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
            itemVended: 'Collect Item'
        },
        'Collect Item': {
            itemCollected: 'Awaiting Selection'
        }
    };;
    private selectedProduct?: Product;
    private insertedMoney: number = 0;
    private sessionId: string;

    constructor(sessionId: string) {
        this.currentState = 'Awaiting Selection';
        this.sessionId = sessionId;
    }
    next(input: string): void {
        const transition = this.transitions[this.currentState][input];
        if (transition) {
            this.currentState = transition;
            publishMessage(this.sessionId, `State changed to ${this.currentState}`);
            this.handleStateActions();
        } else {
            publishMessage(this.sessionId, `Invalid input or no transition available from state ${this.currentState} with input ${input}`);
        }
    }
  private handleStateActions(): void {
    // Handle actions based on the current state
    switch (this.currentState) {
      case "Display Price":
        if (this.selectedProduct) {
          publishMessage(
            this.sessionId,
            `Price is ${this.selectedProduct.price}. Please insert money.`
          );
        }
        break;
      case "Vending":
        this.vendItem();
        break;
      case "Collect Item":
        this.collectItem();
        break;
      case "Awaiting Selection":
        publishMessage(this.sessionId, "Please select a product.");
        break;
      case "Await Money":
        publishMessage(this.sessionId, "Please insert more money.");
        break;
    }
  }

    selectProduct(product: Product): void {
        console.log("Selecting product", product);
        if (this.currentState === 'Awaiting Selection') {
            this.selectedProduct = product;
            this.currentState = 'Display Price';
            publishMessage(this.sessionId, `Selected: ${product.name}, Price: $${product.price}`);
        } else {
            publishMessage(this.sessionId, 'You cannot select a product at this stage.');
        }
    }

    insertMoney(amount: number): void {
        if (this.currentState === 'Display Price' || this.currentState === 'Await Money') {
            this.insertedMoney += amount;
            publishMessage(this.sessionId, `Inserted: $${amount}, Total: $${this.insertedMoney}`);
            this.checkMoney();
        } else {
            publishMessage(this.sessionId, 'You cannot insert money at this stage.');
        }
    }

    private checkMoney(): void {
        if (this.selectedProduct && this.insertedMoney >= this.selectedProduct.price) {
            this.currentState = 'Vending';
            publishMessage(this.sessionId, 'Processing item...');
            this.vendItem();
        } else {
            this.currentState = 'Await Money';
            publishMessage(this.sessionId, 'Additional money required.');
        }
    }

    private vendItem(): void {
        if (this.selectedProduct) {
            publishMessage(this.sessionId, `Vending ${this.selectedProduct.name}...`);
            this.currentState = 'Collect Item';
        }
    }

    collectItem(): void {
        if (this.currentState === 'Collect Item') {
            publishMessage(this.sessionId, `Please collect your item: ${this.selectedProduct?.name}`);
            this.resetMachine();
        } else {
            publishMessage(this.sessionId, 'No item to collect.');
        }
    }

    private resetMachine(): void {
        this.currentState = 'Awaiting Selection';
        this.selectedProduct = undefined;
        this.insertedMoney = 0;
        publishMessage(this.sessionId, 'Session ended. Goodbye!');
        this.sessionId = nanoid()
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