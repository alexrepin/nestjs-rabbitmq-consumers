import { Injectable } from '@nestjs/common';
import { RMQConnection } from '../interface/rmq.connection';
import { BrokerAsPromised, withDefaultConfig } from 'rascal';

@Injectable()
export class RMQService {
  private readonly connections = new Map<string, BrokerAsPromised>();

  public async connect(options: RMQConnection): Promise<void> {
    const queues = {};
    const subscriptions = {};
    const publications = {};
    const uri = `amqp://${options.login}:${options.password}@${options.host}:${
      options.port ?? 5672
    }/${options.vhost ?? ''}`;

    options.queues.map((queue) => {
      queues[queue.name] = {
        assert: true,
        options: queue.queueOptions,
        fullyQualifiedName: queue.name,
      };

      subscriptions[queue.name] = {
        queue: queue.name,
        prefetch: options.prefetch,
      };
    });

    if (options.publishers) {
      options.publishers.map((publisher) => {
        queues[publisher] = {
          assert: false,
          fullyQualifiedName: publisher,
        };

        publications[publisher] = {
          queue: publisher,
          vhost: options.vhost,
        };
      });
    }

    const connect = await BrokerAsPromised.create(
      withDefaultConfig({
        vhosts: {
          [`/${options.vhost}`]: {
            connection: {
              url: uri,
            },
            queues: queues,
            subscriptions: subscriptions,
            publications: publications,
          },
        },
      }),
    );

    this.connections.set(options.name, connect);
  }

  public getConnection(name: string): BrokerAsPromised {
    if (!this.connections.has(name)) {
      throw new Error(`Channel ${name} not found!`);
    }

    return this.connections.get(name);
  }

  public getConnections(): IterableIterator<BrokerAsPromised> {
    return this.connections.values();
  }
}
