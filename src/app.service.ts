import { Injectable } from '@nestjs/common';
import { promisify } from 'util';
import { readFile, exists, writeFile } from 'fs';

@Injectable()
export class AppService {
  private readonly filePath = 'data/tokens.json';
  async getAllTokens() {
    const file = await this.loadFile();
    return file.tokens;
  }

  async saveToken(token) {
    const file = await this.loadFile();
    if (!file.tokens.find((other) => (other === token))) {
      file.tokens.push(token);
      await promisify(writeFile)(this.filePath, JSON.stringify(file, undefined, 2));
    }
  }

  private async loadFile(): Promise<{ tokens: any[] }> {
    try {
      if (await this.fileExists()) {
        const buffer = await promisify(readFile)(this.filePath);
        const tokens = buffer.toString();
        return tokens ? JSON.parse(tokens) : { tokens: [] };
      } else {
        return { tokens: [] };
      }
    } catch (error) {
      console.log(error);
      return { tokens: [] };
    }
  }
  /**
   * Check if the result file exists.
   */
  private async fileExists() {
    return await promisify(exists)(this.filePath);
  }
}
