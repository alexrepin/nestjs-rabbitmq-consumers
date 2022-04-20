import {
  DynamicModule,
  Inject,
  Module,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { RMQService } from './service/rmq.service';
import { ConnectionOptions } from './interface/connection.options';
import { ConsumerService } from './service/consumer.service';
import { ConnectionService } from './service/connection.service';

@Module({
  imports: [DiscoveryModule],
  providers: [RMQService, ConsumerService, ConnectionService],
  exports: [RMQService, ConnectionService],
})
export class RMQModule implements OnModuleInit, OnApplicationShutdown {
  public static isShutdown = false;

  constructor(
    private readonly rmqService: RMQService,
    private readonly connectionService: ConnectionService,
    @Inject(RMQModule.name) private readonly options: ConnectionOptions[],
  ) {}

  static forRoot(options: ConnectionOptions[]): DynamicModule {
    return {
      module: RMQModule,
      providers: [RMQService, { provide: RMQModule.name, useValue: options }],
      exports: [RMQService, ConnectionService],
    };
  }

  async onModuleInit(): Promise<any> {
    for await (const options of this.options) {
      await this.rmqService.connect(options);
    }
  }

  async onApplicationShutdown(): Promise<any> {
    RMQModule.isShutdown = true;

    for (const connection of this.connectionService.getConnections()) {
      await connection.close();
    }
  }
}
