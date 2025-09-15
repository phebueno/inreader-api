import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { TranscriptionUpdatePayload } from '@/transcriptions/types/transcriptions.types';

@WebSocketGateway({ cors: true })
export class TranscriptionsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(TranscriptionsGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.userId);
    this.logger.log(`Client ${client.id} joined room ${data.userId}`);
  }

  sendTranscriptionUpdate(userId: string, payload: TranscriptionUpdatePayload) {
    this.logger.log(`Emitting transcriptionUpdate to user ${userId}`);
    this.server.to(userId).emit('transcriptionUpdate', payload);
  }
}
