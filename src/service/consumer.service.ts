import { Injectable, Logger } from '@nestjs/common';
import { DecoratorEnum } from '../enum/decorator.enum';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { RMQConsumerDecoratorOptions } from '../interface/rmq.consumer.decorator.options';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Message } from 'amqplib';
import { ConnectionService } from './connection.service';
import { RMQModule } from '../rmq.module';

@Injectable()
export class ConsumerService {
  private readonly logger = new Logger(RMQModule.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly connectionService: ConnectionService,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  public register(connection: string): void {
    this.discoveryService.getControllers().map((controller) => {
      this.metadataScanner.scanFromPrototype(
        controller.instance,
        Object.getPrototypeOf(controller.instance),
        (key: string) =>
          this.consume(
            controller.instance,
            controller.instance[key],
            connection,
          ),
      );
    });
  }

  public async consume(
    controller: InstanceWrapper,
    method: () => void,
    connection?: string,
  ): Promise<void> {
    const queueName = <string>(
      this.reflector.get(DecoratorEnum.CONSUMER_DECORATOR_QUEUE, method)
    );
    const options = <RMQConsumerDecoratorOptions>(
      this.reflector.get(DecoratorEnum.CONSUMER_DECORATOR_OPTIONS, method)
    );

    if (!queueName || !options) {
      return;
    }

    if (connection && options.connection !== connection) {
      return;
    }

    const connect = this.connectionService.getConnection(options.connection);
    const channel = await connect.createChannel();
    await channel.prefetch(options.prefetch ?? 1);
    await channel.assertQueue(queueName, options.queueOptions);
    await channel.consume(
      queueName,
      async (message: Message) => {
        try {
          const params: number[] =
            Reflect.getOwnMetadata(
              DecoratorEnum.CONSUMER_MESSAGE_DECORATOR,
              Object.getPrototypeOf(controller),
              method.name,
            ) ?? [];

          const signature = [JSON.parse(message.content.toString())];

          if (params.length > 0) {
            for (const param of params) {
              signature[param] = message;
            }
          }

          if (options.transform) {
            const types = Reflect.getMetadata(
              'design:paramtypes',
              Object.getPrototypeOf(controller),
              method.name,
            );
            signature[0] = plainToClass(types[0], signature[0]);
          }

          if (options.validate) {
            const types = Reflect.getMetadata(
              'design:paramtypes',
              Object.getPrototypeOf(controller),
              method.name,
            );

            const test = Object.assign(new types[0](), signature[0]);
            const errors = await validate(test);

            if (errors.length) {
              this.logger.error('Validation error');
              return channel.ack(message);
            }
          }

          return (await method.apply(controller, signature))
            ? channel.ack(message)
            : channel.nack(message);
        } catch (e) {
          this.logger.error(e.message);
          return channel.ack(message);
        }
      },
      { noAck: false },
    );
  }
}
