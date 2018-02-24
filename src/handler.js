import config from 'config';
import PullRequest from './pull_request';
import Slack from './slack';

const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN || '';
const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN || '';

const options = {
  debug: true,
  protocol: 'https',
  port: 443,
  host: 'api.github.com',
  pathPrefix: '',
  headers: {
    'user-agent': 'PR-Bot',
  },
  timeout: 10000,
};

if (config.host) {
  options.host = config.host;
}

if (config.pathPrefix) {
  options.pathPrefix = config.pathPrefix;
}

export async function handlePullRequestEvent(payload, callback) {
  try {
    const action = payload.action;
    const number = payload.number;
    const repo = payload.repository.name;
    const owner = payload.repository.owner.login;
    const author = payload.pull_request.user.login;

    if (action === 'opened') {
      const reviewers = config.reviewers.filter(
        reviewer => author !== reviewer
      );

      const pr = new PullRequest(options, GITHUB_API_TOKEN);

      if (config.requestReview) {
        await pr.requestReview(owner, repo, number, reviewers);
      }

      if (config.assignReviewers) {
        await pr.assignReviewers(owner, repo, number, reviewers);
      }

      if (config.requestReview === true || config.assignReviewers === true) {
        const slack = new Slack(SLACK_API_TOKEN);
        reviewers.forEach(async reviewer => {
          const message = Slack.buildMessage(
            payload,
            config.message.requestReview,
            'requestReview'
          );
          await slack.postMessage(config.slackUsers[`${reviewer}`], message);
        });
      }
    }
  } catch (error) {
    callback(new Error(error.message));
  }

  callback(null, {
    message: 'Pull request event processing has been completed',
  });
}

export async function handlePullRequestReviewEvent(payload, callback) {
  try {
    const number = payload.pull_request.number;
    const repo = payload.repository.name;
    const owner = payload.repository.owner.login;
    const user = payload.pull_request.user.login;

    const slack = new Slack(SLACK_API_TOKEN);

    if (config.ableToMerge) {
      const pr = new PullRequest(options, GITHUB_API_TOKEN);
      const reviewComments = await pr.getReviewComments(owner, repo, number);
      const approveComments = PullRequest.getApproveComments(
        reviewComments,
        config.approveComments
      );

      if (approveComments.length === config.numApprovers) {
        const message = Slack.buildMessage(
          payload,
          config.message.ableToMerge,
          'ableToMerge'
        );
        await slack.postMessage(config.slackUsers[`${user}`], message);
      }
    }

    if (config.mentionComment) {
      const comment = PullRequest.parseMentionComment(payload.review.body);
      comment.mentionUsers.forEach(async mentionUser => {
        const message = Slack.buildMessage(
          payload,
          config.message.mentionComment,
          'mentionComment'
        );
        await slack.postMessage(config.slackUsers[`${mentionUser}`], message);
      });
    }
  } catch (error) {
    callback(new Error(error.message));
  }

  callback(null, {
    message: 'Pull request review event processing has been completed',
  });
}

export async function handleIssueEvent(payload, callback) {
  try {
    const action = payload.action;
    const slack = new Slack(SLACK_API_TOKEN);

    if (action === 'created') {
      if (config.mentionComment) {
        const comment = PullRequest.parseMentionComment(payload.comment.body);
        comment.mentionUsers.forEach(async mentionUser => {
          const message = Slack.buildMessage(
            payload,
            config.message.mentionComment,
            'mentionComment'
          );
          await slack.postMessage(config.slackUsers[`${mentionUser}`], message);
        });
      }
    }
  } catch (error) {
    callback(new Error(error.message));
  }

  callback(null, { message: 'Issue event processing has been completed' });
}
