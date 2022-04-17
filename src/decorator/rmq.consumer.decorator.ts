import { applyDecorators, SetMetadata } from '@nestjs/common';
import { RmqConsumerDecoratorOptions } from '../interface/rmq.consumer.decorator.options';
import { DecoratorEnum } from '../enum/decorator.enum';

export const RMQConsumer = (
  queue: string,
  options?: RmqConsumerDecoratorOptions,
): MethodDecorator => {
  return applyDecorators(
    SetMetadata(DecoratorEnum.CONSUMER_DECORATOR_QUEUE, queue),
    SetMetadata(DecoratorEnum.CONSUMER_DECORATOR_OPTIONS, {
      ...options,
    }),
  );
};
