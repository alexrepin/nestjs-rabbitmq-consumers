# NestJS - RabbitMQ consumers
[![npm version](https://badgen.net/npm/v/nestjs-rabbitmq-consumers)](https://www.npmjs.com/package/nestjs-rabbitmq-consumers)
[![npm version](https://badgen.net/npm/license/nestjs-rabbitmq-consumers)](https://www.npmjs.com/package/nestjs-rabbitmq-consumers)
[![npm version](https://badgen.net/github/open-issues/alexrepin/nestjs-rabbitmq-consumers)](https://github.com/alexrepin/nestjs-rabbitmq-consumers/issues)
[![npm version](https://badgen.net/github/prs/alexrepin/nestjs-rabbitmq-consumers)](https://github.com/alexrepin/nestjs-rabbitmq-consumers/pulls)

NestJS module for make multi-hosted (not cluster!) RabbitMQ consumers. **Only consumers!**

Special thanks for the reference: [nestjs-amqp](https://github.com/EnriqCG/nestjs-amqp), [nestjs-rmq](https://github.com/AlariCode/nestjs-rmq)

## Features

- Light consumers with decorators support
- Auto-reconnect
- Multi-hosted rabbitmq support
- Support for class-validator decorators.

## Start

First, install the package:

```bash
npm i nestjs-rabbitmq-consumers
```

Setup your connection in root module:

```typescript
import { RMQModule } from 'nestjs-rabbitmq-consumers';

@Module({
    imports: [
        RMQModule.forRoot([
            {
                name: '<connection name>',
                login: '<login>',
                password: '<password>',
                host: '<host>',
                port: '<optional: port>',
                vhost: '<optional: vhost>',
            }
        ]),
    ],
})
export class AppModule {}
```

Setup your controllers:

```typescript
import { Controller } from '@nestjs/common';
import { RMQMessage, RMQConsumer } from 'nestjs-rabbitmq-consumers';
import { ConsumeMessage } from 'amqplib';

@Controller()
export class RequestController {

    @RMQConsumer('queueName', {
        connection: '<connection name>',
        prefetch: 10,
        transform: true,
        validation: true,
        queueOptions: {
            durable: true,
            maxPriority: 255
        }
    })
    public async request(dto: Dto, @RMQMessage() raw: ConsumeMessage): Promise<boolean> {
        return true; // true - ack, false - nack
    }
}
```

@RMQMessage argument required and stored raw message from queue!

Decorator options:

- **connection** – connection name from module config
- **prefetch** – prefetch count, default 1, [read more](https://amqp-node.github.io/amqplib/channel_api.html#channel_prefetch)
- **transform** – applying class-transform for first argument, [read more](https://docs.nestjs.com/techniques/serialization)
- **validate** – applying class-validator for first argument, invalid messages ack by default, [read more](https://docs.nestjs.com/techniques/validation)
- **queueOptions** – object with amqplib queue configuration;

After setup controller module automate create and consume bind queue.

## Sending messages / work with connection

```typescript
import { RMQService } from 'nestjs-rabbitmq-consumers';

@Injectable()
export class SenderService {
    constructor(private readonly rmqService: RMQService) {}

    public async assertQueue(connectionName: string, queueName: string): Promise<void> {
        const connect = this.connectionService.getConnection(connectionName);
        const channel = await connect.createChannel();
        await channel.assertQueue(queueName, {
            durable: true
        });
    }
    
    public async send(connectionName: string, queueName: string, payload: object): Promise<void> {
        await this.rmqService.sendToQueue(connectionName, queueName, payload, {
            priority: 250
        })
    }
}
```

## Contributing

For e2e tests you need to install Docker in your machine and start RabbitMQ docker image with `docker-compose.yml` in `tests/e2e` folder:

```
docker-compose up -d
npm run test:e2e
```