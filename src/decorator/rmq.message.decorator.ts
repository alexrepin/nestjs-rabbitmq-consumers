import 'reflect-metadata';
import { DecoratorEnum } from '../enum/decorator.enum';

export function RMQMessage(
  target: any,
  property: string | symbol,
  parameter: number,
) {
  const params: number[] =
    Reflect.getOwnMetadata(
      DecoratorEnum.CONSUMER_MESSAGE_DECORATOR,
      target,
      property,
    ) || [];

  params.push(parameter);

  Reflect.defineMetadata(
    DecoratorEnum.CONSUMER_MESSAGE_DECORATOR,
    params,
    target,
    property,
  );
}
