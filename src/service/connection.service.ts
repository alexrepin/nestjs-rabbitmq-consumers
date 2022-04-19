import { Injectable } from '@nestjs/common';
import { Connection } from 'amqplib';

@Injectable()
export class ConnectionService {
  private readonly connections = new Map<string, Connection>();

  public setConnection(name: string, connection: Connection): void {
    this.connections.set(name, connection);
  }

  public getConnection(name: string): Connection {
    if (!this.connections.has(name)) {
      throw new Error(`Connection ${name} not found!`);
    }

    return this.connections.get(name);
  }

  public getConnections(): IterableIterator<Connection> {
    return this.connections.values();
  }
}
