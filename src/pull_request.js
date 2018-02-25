'use struct';

import GitHubApi from '@octokit/rest';

export default class PullRequest {
  constructor(options, token) {
    this.github = new GitHubApi(options);
    this.github.authenticate({
      type: 'token',
      token,
    });
  }

  async requestReview(owner, repo, number, reviewers) {
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

  async getReviewComments(owner, repo, number) {
    try {
      const comments = await this.github.pullRequests.getReviews({
        owner,
        repo,
        number,
      });

      return comments;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static getApproveComments(reviewComments, approveComments) {
    const results = [];
    const reviewCommentIDs = [];

    reviewComments.data.map(reviewComment => {
      approveComments.forEach(approveComment => {
        if (!reviewCommentIDs.includes(reviewComment.id)) {
          if (
            reviewComment.body === approveComment ||
            reviewComment.state === 'APPROVED'
          )
            results.push(reviewComment);
          reviewCommentIDs.push(reviewComment.id);
        }
      });
    });

    return results;
  }

  static parseMentionComment(body) {
    const matches = body.match(/@([a-zA-Z0-9_-]+)/g);

    if (matches === null) {
      return {
        mentionUsers: [],
      };
    }

    const mentionUsers = matches.map(match => match.slice(1));

    const results = {
      mentionUsers: mentionUsers || [],
    };

    return results;
  }

  async addLabel(owner, repo, number, labelName, labelColor) {
    try {
      const labels = await this.github.issues.getLabels({ owner, repo });
      const filteredLabels = labels.data.filter(label =>
        label.name.includes(labelName)
      );
      const labelExists = filteredLabels.length > 0;

      if (!labelExists) {
        await this.github.issues.createLabel({
          owner,
          repo,
          name: labelName,
          color: labelColor,
        });
      }

      await this.github.issues.addLabels({
        owner,
        repo,
        number,
        labels: [labelName],
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
