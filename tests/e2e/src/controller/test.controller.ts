import { Controller } from '@nestjs/common';
import { RMQConsumer } from '../../../../src/decorator/rmq.consumer.decorator';
import { TestDto } from '../dto/test.dto';

@Controller()
export class TestController {
  public static test: TestDto = null;

  @RMQConsumer('queue', {
    connection: 'test',
    transform: true,
    validate: true,
  })
  public test(test: TestDto): boolean {
    TestController.test = test;

    return true;
  }
}
