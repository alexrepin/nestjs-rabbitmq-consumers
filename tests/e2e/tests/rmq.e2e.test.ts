import { Test } from '@nestjs/testing';
import { RMQModule } from '../../../src/rmq.module';
import { RMQService } from '../../../src/service/rmq.service';
import { TestController } from '../src/controller/test.controller';
import { TestDto } from '../src/dto/test.dto';
import { INestApplication } from '@nestjs/common';

/**
 * Test case:
 *
 * start docker
 * init module (connect rabbitmq)
 * init controller
 * init queue (controller decorator)
 * publish test message (service)
 * consume test message (controller)
 */
describe('e2e', () => {
  let rmqService: RMQService = null;
  let module: INestApplication = null;

  beforeAll(async () => {
    const test = await Test.createTestingModule({
      imports: [
        RMQModule.forRoot([
          {
            name: 'test',
            login: 'guest',
            password: 'guest',
            host: '127.0.0.1',
          },
        ]),
      ],
      controllers: [TestController],
    }).compile();

    module = test.createNestApplication();
    await module.init();

    rmqService = module.get<RMQService>(RMQService);
  });

  describe('test consuming', () => {
    it('send test message', async () => {
      const result = await rmqService.sendToQueue(
        'test',
        'queue',

        {
          date: '1996-01-28',
        },
        {
          replyTo: 'replyTo',
          correlationId: 'correlationId',
          priority: 250,
        },
      );

      expect(result).toBe(true);
    });

    it('consume test message', async () => {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });

      const dto: TestDto = TestController.test;
      // await module.close();

      expect(dto.date).toBeInstanceOf(Date);
    });
  });
});
