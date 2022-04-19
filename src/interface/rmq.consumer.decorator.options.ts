import { Options } from 'amqplib';

export interface RMQConsumerDecoratorOptions {
  connection: string;
  validate?: boolean;
  transform?: boolean;
  prefetch?: number;
  queueOptions?: Options.AssertQueue;
}
