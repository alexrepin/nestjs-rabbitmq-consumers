import {
  DynamicModule,
  Inject,
  Module,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import {
  DiscoveryModule,
  DiscoveryService,
  MetadataScanner,
} from '@nestjs/core';
import { RMQConnection } from './interface/rmq.connection';
import { ConsumerService } from './service/consumer.service';
import { RMQService } from './service/rmq.service';

@Module({
  imports: [DiscoveryModule],
  providers: [RMQService, ConsumerService],
  exports: [RMQService],
})
export class RMQModule implements OnModuleInit, OnApplicationShutdown {
  constructor(
    private readonly rmqService: RMQService,
    private readonly discoveryService: DiscoveryService,
    private readonly consumerService: ConsumerService,
    private readonly metadataScanner: MetadataScanner,
    @Inject(RMQModule.name) private readonly connections: RMQConnection[],
  ) {}

  static forRoot(options: RMQConnection[]): DynamicModule {
    return {
      module: RMQModule,
      providers: [RMQService, { provide: RMQModule.name, useValue: options }],
      exports: [RMQService],
    };
  }

  async onModuleInit(): Promise<any> {
    for await (const connection of this.connections) {
      await this.rmqService.connect(connection);
    }

    this.discoveryService.getControllers().map((controller) => {
      this.metadataScanner.scanFromPrototype(
        controller.instance,
        Object.getPrototypeOf(controller.instance),
        (key: string) =>
          this.consumerService.consume(
            controller.instance,
            controller.instance[key],
          ),
      );
    });
  }

  async onApplicationShutdown(): Promise<any> {
    for (const connection of this.rmqService.getConnections()) {
      await connection.shutdown();
    }
  }
}
