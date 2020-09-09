import { Injectable } from '@nestjs/common';
import { promisify } from 'util';
import { readFile, exists, writeFile } from 'fs';

@Injectable()
export class TokenService {
  private readonly filePath = 'data/tokenInterests.json';
  async getAllTokenInterests(): Promise<{ token; interest }[]> {
    const file = await this.loadFile();
    return file.tokenInterests;
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

  async getInterestsForToken(token): Promise<{ interest }[]> {
    const tokenInterests = await this.getAllTokenInterests();
    const interests = tokenInterests
      .filter(tokenInterest => tokenInterest.token === token)
      .map(tokenInterest => tokenInterest.interest);
    return interests;
  }
  async getTokensForInterest(interest): Promise<{ token }[]> {
    const tokenInterests = await this.getAllTokenInterests();
    const tokens = tokenInterests
      .filter(tokenInterest => tokenInterest.interest === interest)
      .map(tokenInterest => tokenInterest.token);
    return tokens;
  }

  async saveTokenForInterest(token, interest) {
    const file = await this.loadFile();
    let exists = false;
    file.tokenInterests.forEach(otherTokenInterest => {
      if (
        otherTokenInterest.token === token &&
        otherTokenInterest.interest === interest
      ) {
        exists = true;
        console.log(otherTokenInterest);
      }
    });
    if (!exists) {
      file.tokenInterests.push({ token, interest });
      await promisify(writeFile)(
        this.filePath,
        JSON.stringify(file, undefined, 2),
      );
    }
  }
  async deleteTokenForInterest(token, interest) {
    const file = await this.loadFile();
    const newTokenInterests: { token; interest }[] = [];
    file.tokenInterests.forEach(tokenInterest => {
      if (
        tokenInterest.token === token &&
        tokenInterest.interest === interest
      ) {
        // filter out
      } else {
        newTokenInterests.push({
          token: tokenInterest.token,
          interest: tokenInterest.interest,
        });
      }
    });
    file.tokenInterests = newTokenInterests;
    await promisify(writeFile)(
      this.filePath,
      JSON.stringify(file, undefined, 2),
    );
  }

  private async loadFile(): Promise<{ tokenInterests: any[] }> {
    try {
      if (await this.fileExists()) {
        const buffer = await promisify(readFile)(this.filePath);
        const tokenInterests = buffer.toString();
        return tokenInterests
          ? JSON.parse(tokenInterests)
          : { tokenInterests: [] };
      } else {
        return { tokenInterests: [] };
      }
    } catch (error) {
      console.log(error);
      return { tokenInterests: [] };
    }
  }
  /**
   * Check if the result file exists.
   */
  private async fileExists() {
    return await promisify(exists)(this.filePath);
  }
}
