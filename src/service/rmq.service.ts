import { Injectable } from '@nestjs/common';
import * as amqp from 'amqplib';
import { ConnectionOptions } from '../interface/connection.options';
import { Channel, Options } from 'amqplib';
import { ConnectionUriFactory } from '../factory/ConnectionUriFactory';
import { ConsumerService } from './consumer.service';
import Publish = Options.Publish;
import { ConnectionService } from './connection.service';
import { RMQModule } from '../rmq.module';

@Injectable()
export class RMQService {
  private readonly timeout = 10 * 1000;
  private readonly channels = new Map<string, Channel>();

  constructor(
    private readonly consumerService: ConsumerService,
    private readonly connectionService: ConnectionService,
  ) {}

  public async connect(options: ConnectionOptions): Promise<void> {
    const connection = await amqp.connect(ConnectionUriFactory.create(options));
    ['close', 'error'].map((event) =>
      connection.on(event, () => {
        if (!RMQModule.isShutdown) {
          setTimeout(() => this.connect(options), this.timeout);
        }
      }),
    );

    this.connectionService.setConnection(options.name, connection);
    this.consumerService.register(options.name);
  }

  public async sendToQueue(
    connection: string,
    queue: string,
    payload: object,
    options?: Publish,
  ): Promise<boolean> {
    const connect = await this.connectionService.getConnection(connection);
    let channel: Channel;

    if (this.channels.has(connection)) {
      channel = this.channels.get(connection);
    } else {
      channel = await connect.createChannel();
      channel.on('close', () => {
        this.channels.delete(connection);
        throw new Error('Channel closed');
      });

      this.channels.set(connection, channel);
    }

    return channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(payload)),
      options,
    );
  }
}
