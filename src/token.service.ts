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
  async getAllTokenInterests(): Promise<any[]> {
    return this.tokenInterestModel.find().exec();
  }
  async getAllTokens(): Promise<{ token }[]> {
    const tokenInterests = await this.getAllTokenInterests();
    const tokens = tokenInterests.map(tokenInterest => tokenInterest.token);
    return tokens.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }
  async getAllTokenInterestAmounts() {
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

  async getInterestsForToken(token) {
    return await (await this.tokenInterestModel.find({ token }).exec()).map(
      tokenInterest => tokenInterest.interest,
    );
  }
  async getTokensForInterest(
    interest,
    notificationType?,
  ): Promise<{ token }[]> {
    const tokenInterests = await this.getAllTokenInterests();
    const tokenInterestsWithMatchingInterest = tokenInterests.filter(
      tokenInterest => tokenInterest.interest === interest,
    );
    const tokenInterestsForNotificationType = [];
    switch (notificationType) {
      case 'day':
        tokenInterestsForNotificationType.push(
          ...tokenInterestsWithMatchingInterest.filter(
            tokenInterest => tokenInterest.lastNotification === 'week',
          ),
        );
      case 'hour':
        tokenInterestsForNotificationType.push(
          ...tokenInterestsWithMatchingInterest.filter(
            tokenInterest => tokenInterest.lastNotification === 'day',
          ),
        );
      case 'minute':
        tokenInterestsForNotificationType.push(
          ...tokenInterestsWithMatchingInterest.filter(
            tokenInterest => tokenInterest.lastNotification === 'hour',
          ),
        );
      case 'week':
        tokenInterestsForNotificationType.push(
          ...tokenInterestsWithMatchingInterest.filter(
            tokenInterest => tokenInterest.lastNotification === undefined,
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
  }

  async saveTokenForInterest(token, interest) {
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
  async markNotified(token, interest, notificationType) {
    const existingEntries = await this.tokenInterestModel
      .find({ token, interest })
      .exec();
    if (existingEntries.length > 0) {
      return await this.tokenInterestModel
        .update(
          { token, interest },
          { token, interest, lastNotification: notificationType },
        )
        .exec();
    }
    return await (
      await this.tokenInterestModel.create({
        token,
        interest,
        lastNotification: notificationType,
      })
    ).execPopulate();
  }
  async deleteTokenForInterest(token, interest) {
    return (await this.tokenInterestModel.deleteOne({ token, interest }))
      .deletedCount;
  }
}
