import { Injectable } from '@nestjs/common';
import { promisify } from 'util';
import { readFile, exists, writeFile } from 'fs';

@Injectable()
export class TokenService {
  private readonly filePath = 'data/tokenInterests.json';
  async getAllTokenInterests(): Promise<{ token, interest }[]> {
    const file = await this.loadFile();
    return file.tokenInterests;
  }
  async getAllTokens(): Promise<{ token }[]> {
    const tokenInterests = await this.getAllTokenInterests();
    const tokens = tokenInterests.map(tokenInterest => tokenInterest.token);
    return tokens.filter((value, index, self) => { return self.indexOf(value) === index; });
  }

  async getInterestsForToken(token): Promise<{ interest }[]> {
    const tokenInterests = await this.getAllTokenInterests();
    const interests = tokenInterests.filter((tokenInterest) => (tokenInterest.token === token));
    return interests;
  }
  async getTokensForInterest(interest): Promise<{ token }[]> {
    const tokenInterests = await this.getAllTokenInterests();
    const tokens = tokenInterests.filter((tokenInterest) => (tokenInterest.interest === interest));
    return tokens;
  }

  async saveTokenForInterest(token, interest) {
    const file = await this.loadFile();
    if (!file.tokenInterests.find((otherTokenInterest) => (otherTokenInterest === { token, interest }))) {
      file.tokenInterests.push({ token, interest });
      await promisify(writeFile)(this.filePath, JSON.stringify(file, undefined, 2));
    }
  }

  private async loadFile(): Promise<{ tokenInterests: { token, interest }[] }> {
    try {
      if (await this.fileExists()) {
        const buffer = await promisify(readFile)(this.filePath);
        const tokenInterests = buffer.toString();
        return tokenInterests ? JSON.parse(tokenInterests) : { tokenInterests: [] };
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
