import { Test } from '@nestjs/testing';
import { RMQModule } from '../../../src/rmq.module';
import { RMQService } from '../../../src/service/rmq.service';
import { TestController } from '../src/controller/test.controller';
import { TestDto } from '../src/dto/test.dto';

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

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        RMQModule.forRoot([
          {
            name: 'test',
            login: 'guest',
            password: 'guest',
            host: '127.0.0.1',
            queues: [
              {
                name: 'queue',
                queueOptions: {
                  durable: true,
                  maxPriority: 255,
                },
              },
            ],
            publishers: ['publisher', 'queue'],
          },
        ]),
      ],
      controllers: [TestController],
    }).compile();

    module.createNestApplication();
    await module.init();

    rmqService = module.get<RMQService>(RMQService);
  });

  describe('send test message to queue', () => {
    it('test', async () => {
      const connection = rmqService.getConnection('test');
      const result = await connection.publish(
        'publisher',
        {
          test: 1,
        },
        {
          options: {
            replyTo: 'replyTo',
            correlationId: 'correlationId',
            priority: 250,
          },
        },
      );

      expect(!result.isAborted()).toBe(true);
    });
  });

  describe('consume test message from queue', () => {
    it('send test message', async () => {
      const connection = rmqService.getConnection('test');
      const result = await connection.publish(
        'queue',
        {
          date: '1996-01-28',
        },
        {
          options: {
            replyTo: 'replyTo',
            correlationId: 'correlationId',
            priority: 250,
          },
        },
      );

      expect(!result.isAborted()).toBe(true);
    });

    it('consume test message', async () => {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });

      const dto: TestDto = TestController.test;

      console.log(dto);
      expect(dto.date).toBeInstanceOf(Date);
    });
  });
});
