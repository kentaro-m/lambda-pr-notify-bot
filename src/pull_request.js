'use struct';

import GitHubApi from 'github';
import config from 'config';

export default class PullRequest {
  constructor(options, token) {
    this.github = new GitHubApi(options);
    this.github.authenticate({
      type: 'token',
      token,
    });
  }

  async requestReview(owner, repo, number, reviewers) {
    if (!config.requestReview) {
      return;
    }

    try {
      await this.github.pullRequests.createReviewRequest({
        owner,
        repo,
        number,
        reviewers,
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async assignReviewers(owner, repo, number, assignees) {
    if (!config.assignReviewers) {
      return;
    }

    try {
      await this.github.issues.edit({
        owner,
        repo,
        number,
        assignees,
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getApproveComments(owner, repo, number, approveComments) {
    try {
      const comments = await this.github.pullRequests.getReviews({
        owner,
        repo,
        number,
      });

      const results = [];

      await Promise.all(comments.data.map(async function (comment) {
        approveComments.forEach(function (approveComment) {
          if (comment.body === approveComment || comment.state === 'APPROVED') {
            results.push(comment);
          }
        });
        return;
      }));

      return results;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static parseMentionComment(body, url) {
    const matches = body.match(/@([a-zA-Z0-9_-]+)/g);

    if (matches === null) {
      return {};
    }

    const mentionUsers = matches.map((match) => {
      return match.slice(1);
    });

    const results = {
      mentionUsers,
      url,
    };

    return results;
  }
}
