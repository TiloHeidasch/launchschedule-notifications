import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TokenInterest } from './tokenInterest.schema';
import { Model } from 'mongoose';

@Injectable()
export class TokenService {
  private readonly filePath = 'data/tokenInterests.json';
  constructor(
    @InjectModel(TokenInterest.name)
    private tokenInterestModel: Model<TokenInterest>,
  ) {}
  async getAllTokenInterests(): Promise<TokenInterest[]> {
    return this.tokenInterestModel.find().exec();
  }
  async getAllTokens(): Promise<string[]> {
    const tokenInterests = await this.getAllTokenInterests();
    const tokens = tokenInterests.map(tokenInterest => tokenInterest.token);
    return tokens.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }
  async getAllTokenInterestAmounts(): Promise<
    {
      interest: string;
      amount: number;
    }[]
  > {
    const tokenInterests = await this.getAllTokenInterests();
    const interests = tokenInterests
      .map(tokenInterest => tokenInterest.interest)
      .filter((value, index, self) => {
        return self.indexOf(value) === index;
      });
    const interestAmounts: { interest; amount }[] = [];
    interests.forEach(interest => {
      const amount = tokenInterests.filter(
        tokenInterest => tokenInterest.interest === interest,
      ).length;
      interestAmounts.push({ interest, amount });
    });
    return interestAmounts;
  }

  async getInterestsForToken(token): Promise<string[]> {
    return await (await this.tokenInterestModel.find({ token }).exec()).map(
      tokenInterest => tokenInterest.interest,
    );
  }
  async getTokensForInterest(
    interest,
    notificationType?,
    date?,
    relatedInterest?,
  ): Promise<string[]> {
    const tokenInterests = await this.getAllTokenInterests();
    const tokenInterestsWithMatchingInterest = tokenInterests.filter(
      tokenInterest => tokenInterest.interest === interest,
    );
    if (!relatedInterest) {
      const tokenInterestsForNotificationType = [];
      switch (notificationType) {
        case 'minute':
          tokenInterestsForNotificationType.push(
            ...tokenInterestsWithMatchingInterest.filter(
              tokenInterest =>
                tokenInterest.lastNotification === 'hour' &&
                tokenInterest.targetDate === date,
            ),
          );
        case 'hour':
          tokenInterestsForNotificationType.push(
            ...tokenInterestsWithMatchingInterest.filter(
              tokenInterest =>
                tokenInterest.lastNotification === 'day' &&
                tokenInterest.targetDate === date,
            ),
          );
        case 'day':
          tokenInterestsForNotificationType.push(
            ...tokenInterestsWithMatchingInterest.filter(
              tokenInterest =>
                tokenInterest.lastNotification === 'week' &&
                tokenInterest.targetDate === date,
            ),
          );
        case 'week':
          tokenInterestsForNotificationType.push(
            ...tokenInterestsWithMatchingInterest.filter(
              tokenInterest =>
                tokenInterest.lastNotification === undefined ||
                tokenInterest.targetDate !== date,
            ),
          );
          break;

        default:
          tokenInterestsForNotificationType.push(
            ...tokenInterestsWithMatchingInterest,
          );
          break;
      }

      if (tokenInterestsForNotificationType.length === 0) {
        return [];
      }
      const tokens = tokenInterestsForNotificationType.map(
        tokenInterest => tokenInterest.token,
      );
      return tokens;
    } else {
      const tokenInterestsForNotificationTypeAndRelatedInterest = [];
      tokenInterestsWithMatchingInterest.forEach(tokenInterest => {
        let isRelevant = true;
        tokenInterest.relatedInterestsNotifications.forEach(
          relatedInterestNotification => {
            if (relatedInterestNotification.interest === relatedInterest) {
              switch (notificationType) {
                case 'minute':
                  if (
                    relatedInterestNotification.lastNotification === 'minute'
                  ) {
                    isRelevant = false;
                  }
                  break;
                case 'hour':
                  if (relatedInterestNotification.lastNotification === 'hour') {
                    isRelevant = false;
                  }
                  break;
                case 'day':
                  if (relatedInterestNotification.lastNotification === 'day') {
                    isRelevant = false;
                  }
                  break;
                case 'week':
                  if (relatedInterestNotification.lastNotification === 'week') {
                    isRelevant = false;
                  }
                  break;

                default:
                  break;
              }
              console.log(
                JSON.stringify({
                  interest,
                  notificationType,
                  relatedInterest,
                  isRelevant,
                  tokenInterest,
                  relatedInterestNotification,
                }),
              );
            }
          },
        );
        if (isRelevant) {
          tokenInterestsForNotificationTypeAndRelatedInterest.push(
            tokenInterest,
          );
        }
      });
      if (tokenInterestsForNotificationTypeAndRelatedInterest.length === 0) {
        return [];
      }
      const tokens = tokenInterestsForNotificationTypeAndRelatedInterest.map(
        tokenInterest => tokenInterest.token,
      );
      return tokens;
    }
  }

  async saveTokenForInterest(token, interest): Promise<TokenInterest> {
    const existingEntries = await this.tokenInterestModel
      .find({ token, interest })
      .exec();
    if (existingEntries.length > 0) {
      return existingEntries[0];
    }
    return await (
      await this.tokenInterestModel.create({ token, interest })
    ).execPopulate();
  }
  async markNotified(
    token,
    interest,
    notificationType,
    date,
    relatedInterest?,
  ): Promise<TokenInterest> {
    const existingEntry = await this.tokenInterestModel
      .findOne({ token, interest })
      .exec();
    if (existingEntry) {
      if (!relatedInterest) {
        return await this.tokenInterestModel
          .update(
            { token, interest },
            {
              token,
              interest,
              lastNotification: notificationType,
              targetDate: date,
            },
          )
          .exec();
      } else {
        return await this.tokenInterestModel
          .update(
            { token, interest },
            {
              token,
              interest,
              relatedInterestsNotifications: [
                ...existingEntry.relatedInterestsNotifications,
                {
                  interest: relatedInterest,
                  lastNotification: notificationType,
                  targetDate: date,
                },
              ],
            },
          )
          .exec();
      }
    }
  }
  async deleteTokenForInterest(token, interest): Promise<number> {
    return (await this.tokenInterestModel.deleteOne({ token, interest }))
      .deletedCount;
  }
}
