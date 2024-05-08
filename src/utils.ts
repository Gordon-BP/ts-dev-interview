import { PubSub }  from "./pubsub.js";

export const publishMessage = (topic:string, message: string) => {
    const fn = ()=>{
        console.log(message)
    }
    const ps = new PubSub
    ps.publish(topic,fn);
};
