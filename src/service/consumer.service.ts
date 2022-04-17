import { Injectable } from '@nestjs/common';
import { DecoratorEnum } from '../enum/decorator.enum';
import { Reflector } from '@nestjs/core';
import { RMQService } from './rmq.service';
import { RmqConsumerDecoratorOptions } from '../interface/rmq.consumer.decorator.options';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ConsumerService {
  constructor(
    private readonly reflector: Reflector,
    private readonly rmqService: RMQService,
  ) {}

  public async consume(
    controller: InstanceWrapper,
    method: () => void,
  ): Promise<void> {
    const queueName = <string>(
      this.reflector.get(DecoratorEnum.CONSUMER_DECORATOR_QUEUE, method)
    );
    const options = <RmqConsumerDecoratorOptions>(
      this.reflector.get(DecoratorEnum.CONSUMER_DECORATOR_OPTIONS, method)
    );

    if (!queueName || !options) {
      return;
    }

    const connection = this.rmqService.getConnection(options.connection);
    const subscription = await connection.subscribe(queueName);
    await connection.subscribe(queueName);
    subscription
      .on('message', async (message, content, ackOrNack) => {
        const params: number[] =
          Reflect.getOwnMetadata(
            DecoratorEnum.CONSUMER_MESSAGE_DECORATOR,
            Object.getPrototypeOf(controller),
            method.name,
          ) ?? [];

        const signature = [content];

        if (params.length > 0) {
          for (const param of params) {
            signature[param] = {
              content: message.content,
              fields: message.fields,
              properties: message.properties,
            };
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
            const message = errors
              .map((m) => {
                return Object.values(m.constraints).join('; ');
              })
              .join('; ');

            return ackOrNack(new Error(message), {
              strategy: 'nack',
              defer: 1000,
              requeue: true,
            });
          }
        }

        const result = await method.apply(controller, signature);

        if (result) {
          ackOrNack();
        } else {
          ackOrNack(new Error(), {
            strategy: 'nack',
            defer: 1000,
            requeue: true,
          });
        }
      })
      .on('error', console.error);
  }
}
