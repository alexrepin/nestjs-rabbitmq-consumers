import { ConnectionOptions } from '../interface/connection.options';

export class ConnectionUriFactory {
  public static create(options: ConnectionOptions): string {
    return `amqp://${options.login}:${options.password}@${options.host}:${
      options.port ?? 5672
    }/${options.vhost ?? ''}?heartbeat=10`;
  }
}
