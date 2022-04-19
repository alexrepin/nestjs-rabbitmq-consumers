import { Injectable } from '@nestjs/common';
import * as amqp from 'amqplib';
import { ConnectionOptions } from '../interface/connection.options';
import { Options } from 'amqplib';
import { ConnectionUriFactory } from '../factory/ConnectionUriFactory';
import { ConsumerService } from './consumer.service';
import Publish = Options.Publish;
import { ConnectionService } from './connection.service';
import { RMQModule } from '../rmq.module';

@Injectable()
export class RMQService {
  private readonly timeout = 10 * 1000;

  constructor(
    private readonly consumerService: ConsumerService,
    private readonly connectionService: ConnectionService,
  ) {}

  public async connect(options: ConnectionOptions): Promise<void> {
    const connection = await amqp.connect(ConnectionUriFactory.create(options));
    connection.on('close', () => {
      if (!RMQModule.isShutdown) {
        setTimeout(() => this.connect(options), this.timeout);
      }
    });

    this.connectionService.setConnection(options.name, connection);
    this.consumerService.register(options.name);
  }

  public async sendToQueue(
    connection: string,
    queue: string,
    payload: object,
    options?: Publish,
  ): Promise<boolean> {
    const connect = this.connectionService.getConnection(connection);
    const channel = await connect.createChannel();
    const result = channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(payload)),
      options,
    );

    await channel.close();

    return result;
  }
}
