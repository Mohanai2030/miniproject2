import { producer } from "../config/kafka.js";

// need to check whether connect and disconnect every time we want to send message or only during startup of server. 

export async function kafkaProduceMessage(topic, message) {
    await producer.connect();  
    await producer.send({
        topic: topic,
        messages: [{ value: JSON.stringify(message) }],
    });
    await producer.disconnect();
}