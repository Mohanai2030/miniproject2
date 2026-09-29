import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092"], //point to broker ids 
});

export const producer = kafka.producer();