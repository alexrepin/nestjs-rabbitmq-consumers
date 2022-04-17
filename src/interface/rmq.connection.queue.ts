import { Options } from 'amqplib';

export interface RmqConnectionQueue {
  name: string;
  queueOptions?: Options.AssertQueue;
}
