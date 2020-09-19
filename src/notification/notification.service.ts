import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Interest, InterestAmount } from './types/interest';
import { Notification } from './types/notification.schema';

@Injectable()
export class NotificationService {
  logger: Logger = new Logger();
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
  ) {}

  async getInterestAmounts(): Promise<InterestAmount[]> {
    this.logger.debug(
      JSON.stringify({}),
      'NotificationService.getInterestAmounts',
    );
    const aggregation = await this.notificationModel.aggregate([
      {
        $group: {
          _id: { interest: '$interest' },
          amount: { $sum: 1 },
        },
      },
    ]);
    return aggregation.map(aggregated => ({
      interest: aggregated._id.interest,
      amount: aggregated.amount,
    }));
  }

  async getNotifications(type, id, token): Promise<Notification[]> {
    this.logger.debug(
      JSON.stringify({
        type,
        id,
        token,
      }),
      'NotificationService.getNotifications',
    );
    const query = this.notificationModel.find({});

    if (id) {
      query.find({ 'interest.id': id });
    }
    if (type) {
      query.find({ 'interest.type': type });
    }
    if (token) {
      query.find({ token });
    }
    return await query.exec();
  }
  async insertNotification(type, id, token): Promise<Notification> {
    this.logger.debug(
      JSON.stringify({
        type,
        id,
        token,
      }),
      'NotificationService.insertNotification',
    );
    try {
      return await this.notificationModel.create({
        interest: { type, id },
        token,
      });
    } catch (error) {
      if (error.code === 11000) {
        this.logger.debug(
          'Duplicate Key',
          'NotificationService.insertNotification',
        );
        throw new ConflictException('Duplicate Key');
      }
    }
  }
  async markNotified(
    type,
    id,
    token,
    relatedType,
    relatedId,
    date,
    period,
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
      'NotificationService.markNotified',
    );

    const item = await this.notificationModel.findOne({
      'interest.id': id,
      'interest.type': type,
      token,
    });

    if (!item) {
      this.logger.debug('No Notification for given parameters');
      throw new NotFoundException('No Notification for given parameters');
    }
    if (relatedType && relatedId) {
      const relatedInterest: Interest = { type: relatedType, id: relatedId };
      return await this.notificationModel.updateOne(
        {
          'interest.id': id,
          'interest.type': type,
          token,
        },
        { notified: [...item.notified, { date, period, relatedInterest }] },
      );
    } else {
      return await this.notificationModel.updateOne(
        {
          'interest.id': id,
          'interest.type': type,
          token,
        },
        { notified: [...item.notified, { date, period }] },
      );
    }
  }
  async deleteNotification(type, id, token) {
    this.logger.debug(
      JSON.stringify({
        type,
        id,
        token,
      }),
      'NotificationService.deleteNotification',
    );
    const item = await this.notificationModel.findOne({
      'interest.id': id,
      'interest.type': type,
      token,
    });
    if (!item) {
      this.logger.debug('No Notification for given parameters');
      throw new NotFoundException('No Notification for given parameters');
    }
    await this.notificationModel.deleteOne({
      'interest.id': id,
      'interest.type': type,
      token,
    });
  }
}
