import { applyDecorators, SetMetadata } from '@nestjs/common';
import { RMQConsumerDecoratorOptions } from '../interface/rmq.consumer.decorator.options';
import { DecoratorEnum } from '../enum/decorator.enum';

export const RMQConsumer = (
  queue: string,
  options?: RMQConsumerDecoratorOptions,
): MethodDecorator => {
  return applyDecorators(
    SetMetadata(DecoratorEnum.CONSUMER_DECORATOR_QUEUE, queue),
    SetMetadata(DecoratorEnum.CONSUMER_DECORATOR_OPTIONS, {
      ...options,
    }),
  );
};
