import {
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Notification } from './types/notification.schema';
import { NotificationService } from './notification.service';
import { Interest, InterestAmount } from './types/interest';

@Controller('notification')
export class NotificationController {
  logger: Logger = new Logger();
  constructor(private service: NotificationService) {}
  @Get()
  @ApiTags('getNotifications')
  @ApiOperation({ description: 'Get all notifications' })
  @ApiOkResponse({
    description: 'The found notifications',
    type: [Notification],
  })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'id', required: false })
  @ApiQuery({ name: 'token', required: false })
  async getNotifications(
    @Query('type') type: string,
    @Query('id') id: string,
    @Query('token') token: string,
  ): Promise<Notification[]> {
    this.logger.debug(
      JSON.stringify({
        type,
        id,
        token,
      }),
      'NotificationController.getNotifications',
    );
    return await this.service.getNotifications(type, id, token);
  }
  @Get('amount')
  @ApiTags('getNotificationAmounts')
  @ApiOperation({ description: 'Get all interestAmounts' })
  @ApiOkResponse({
    description: 'All found interests with their respective amounts',
    type: [InterestAmount],
  })
  async getInterestAmounts(): Promise<InterestAmount[]> {
    this.logger.debug(
      JSON.stringify({}),
      'NotificationController.getInterestAmounts',
    );
    return await this.service.getInterestAmounts();
  }
  @Put()
  @ApiTags('markNotified')
  @ApiOperation({ description: 'Mark a Notification dataset as notified' })
  @ApiNotFoundResponse({ description: 'The specified dataset cannot be found' })
  @ApiOkResponse({
    description: 'The Notification has been marked as notified',
    type: Notification,
  })
  @ApiQuery({ name: 'type', required: true })
  @ApiQuery({ name: 'id', required: true })
  @ApiQuery({ name: 'token', required: true })
  @ApiQuery({ name: 'relatedType', required: false })
  @ApiQuery({ name: 'relatedId', required: false })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'period', required: true })
  async markNotified(
    @Query('type') type: string,
    @Query('id') id: string,
    @Query('token') token: string,
    @Query('relatedType') relatedType: string,
    @Query('relatedId') relatedId: string,
    @Query('date') date: string,
    @Query('period') period: string,
  ): Promise<Notification> {
    this.logger.debug(
      JSON.stringify({
        type,
        id,
        token,
        relatedType,
        relatedId,
        date,
        period,
      }),
      'NotificationController.markNotified',
    );
    return await this.service.markNotified(
      type,
      id,
      token,
      relatedType,
      relatedId,
      date,
      period,
    );
  }
  @Post()
  @ApiTags('requestNotification')
  @ApiOperation({ description: 'Create a Notification' })
  @ApiConflictResponse({
    description: 'The specified dataset does already exist',
  })
  @ApiOkResponse({
    description: 'The created notification',
    type: Notification,
  })
  @ApiQuery({ name: 'type', required: true })
  @ApiQuery({ name: 'id', required: true })
  @ApiQuery({ name: 'token', required: true })
  async requestNotification(
    @Query('type') type: string,
    @Query('id') id: string,
    @Query('token') token: string,
  ): Promise<Notification> {
    this.logger.debug(
      JSON.stringify({
        type,
        id,
        token,
      }),
      'NotificationController.requestNotification',
    );
    return await this.service.insertNotification(type, id, token);
  }
  @Delete()
  @ApiTags('deleteNotification')
  @ApiOkResponse({ description: 'The dataset was deleted' })
  @ApiNotFoundResponse({ description: 'The specified dataset cannot be found' })
  @ApiQuery({ name: 'type', required: true })
  @ApiQuery({ name: 'id', required: true })
  @ApiQuery({ name: 'token', required: true })
  async deleteNotification(
    @Query('type') type: string,
    @Query('id') id: string,
    @Query('token') token: string,
  ): Promise<void> {
    this.logger.debug(
      JSON.stringify({
        type,
        id,
        token,
      }),
      'NotificationController.deleteNotification',
    );
    await this.service.deleteNotification(type, id, token);
  }
}
