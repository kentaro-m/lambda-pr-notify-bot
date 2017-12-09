'use struct';

import { WebClient } from '@slack/client';

export default class Slack {
  constructor(token) {
    this.web = new WebClient(token);
  }

  async postMessage(user, attachments) {
    try {
      const channel = `@${user}`;
      this.web.chat.postMessage(channel, '', { attachments });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static buildMessage(payload, message, type = '') {
    const eventType = Object.prototype.hasOwnProperty.call(payload, 'issue') ? 'issue' : 'pull_request';
    const user = payload[`${eventType}`].user;
    const title = payload[`${eventType}`].title;
    const titleLink = payload[`${eventType}`].html_url;

    const attachments = [{
      color: '#36a64f',
      author_name: `${user.login} (${payload.repository.name})`,
      author_icon: user.avatar_url,
      title,
      title_link: titleLink,
      text: message,
    }];

    if (type === 'assignReviewers' || type === 'requestReview') {
      attachments[0].color = 'warning';
      attachments[0].text = `:eyes: ${message}`;
    }

    if (type === 'ableToMerge') {
      attachments[0].text = `:white_check_mark: ${message}`;
    }

    if (type === 'mentionComment') {
      attachments[0].color = 'warning';
      attachments[0].text = `:eyes: ${message}`;

      const commentType = Object.prototype.hasOwnProperty.call(payload, 'issue') ? 'comment' : 'review';
      attachments[0].title_link = payload[`${commentType}`].html_url;
      attachments[0].fields = [
        {
          title: 'Comment',
          value: payload[`${commentType}`].body,
          short: true,
        },
      ];
    }

    return attachments;
  }
}
