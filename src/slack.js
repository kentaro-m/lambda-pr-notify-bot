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
    const attachments = [{
      color: '#36a64f',
      author_name: `${payload.pull_request.user.login} (${payload.pull_request.head.repo.name})`,
      author_icon: payload.pull_request.user.avatar_url,
      title: payload.pull_request.title,
      title_link: payload.pull_request.html_url,
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
      attachments[0].title_link = payload.review.html_url;
      attachments[0].fields = [
        {
          title: 'Comment',
          value: payload.review.body,
          short: true,
        },
      ];
    }

    return attachments;
  }
}
