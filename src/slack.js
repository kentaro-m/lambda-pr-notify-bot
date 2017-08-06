'use struct';

import { WebClient } from '@slack/client';

export default class Slack {
  constructor(token) {
    this.web = new WebClient(token);
  }

  async postMessage(user, url, message) {
    try {
      const channel = `@${user}`;
      const text = `${channel}\n${url}\n${message}`;
      this.web.chat.postMessage(channel, text);
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
