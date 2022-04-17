import { RmqConnectionQueue } from './rmq.connection.queue';

export interface RMQConnection {
  name: string;
  login: string;
  password: string;
  host: string;
  port?: number;
  vhost?: string;
  prefetch?: number;
  queues: RmqConnectionQueue[];
  publishers?: string[];
}
