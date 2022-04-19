import { Controller } from '@nestjs/common';
import { RMQConsumer } from '../../../../src/decorator/rmq.consumer.decorator';
import { TestDto } from '../dto/test.dto';
import { Message } from 'amqplib';
import { RMQMessage } from '../../../../src/decorator/rmq.message.decorator';

@Controller()
export class TestController {
  public static test: TestDto = null;

  @RMQConsumer('queue', {
    connection: 'test',
    transform: true,
    validate: true,
    prefetch: 11,
    queueOptions: {
      maxPriority: 255,
      durable: true,
    },
  })
  public test(test: TestDto, @RMQMessage raw: Message): boolean {
    TestController.test = test;

    return true;
  }
}
