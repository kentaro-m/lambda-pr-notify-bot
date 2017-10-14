import crypto from 'crypto';
import config from 'config';
import Promise from 'bluebird';
import PullRequest from './pull_request';
import Slack from './slack';

const options = {
  debug: true,
  protocol: 'https',
  port: 443,
  host: 'api.github.com',
  pathPrefix: '',
  headers: {
    'user-agent': 'PR-Bot',
  },
  Promise,
  timeout: 10000,
};

if (config.host) {
  options.host = config.host;
}

if (config.pathPrefix) {
  options.pathPrefix = config.pathPrefix;
}

function calculateSignature(secret, payload) {
  return `sha1=${crypto.createHmac('sha1', secret).update(payload, 'utf-8').digest('hex')}`;
}

exports.handler = async (event, context, callback) => {
  const SECRET_TOKEN = process.env.SECRET_TOKEN || '';
  const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN || '';
  const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN || '';
  const githubEvent = event.headers['X-GitHub-Event'];
  const signature = event.headers['X-Hub-Signature'];
  const payload = event.body;

  if (!SECRET_TOKEN) {
    return callback(new Error('Secret Token is not found.'));
  }

  if (!SLACK_API_TOKEN) {
    return callback(new Error('Slack API Token is not found.'));
  }

  if (!GITHUB_API_TOKEN) {
    return callback(new Error('GitHub API Token is not found.'));
  }

  const calculatedSignature = calculateSignature(SECRET_TOKEN, JSON.stringify(payload));

  if (signature !== calculatedSignature) {
    return callback(new Error('X-Hub-Signature and Calculated Signature do not match.'));
  }

  if (githubEvent === 'pull_request') {
    try {
      const action = payload.action;
      const number = payload.number;
      const repo = payload.repository.name;
      const owner = payload.repository.owner.login;
      const url = payload.pull_request.html_url;
      const author = payload.pull_request.user.login;

      if (config.repositories.indexOf(repo) !== -1 && action === 'opened') {
        const reviewers = config.reviewers.filter((reviewer) => {
          return author !== reviewer;
        });

        const pr = new PullRequest(options, GITHUB_API_TOKEN);
        await pr.requestReview(owner, repo, number, reviewers);
        await pr.assignReviewers(owner, repo, number, reviewers);

        if (config.requestReview === true || config.assignReviewers === true) {
          const slack = new Slack(SLACK_API_TOKEN);
          reviewers.forEach(async (reviewer) => {
            await slack.postMessage(config.slackUsers[`${reviewer}`], url, config.message.requestReview);
          });
        }
      }
    } catch (error) {
      return callback(new Error(error.message));
    }

    return callback(null, { message: 'Pull request event processing has been completed' });
  } else if (githubEvent === 'pull_request_review') {
    try {
      const number = payload.pull_request.number;
      const repo = payload.repository.name;
      const owner = payload.repository.owner.login;
      const user = payload.pull_request.user.login;
      const url = payload.pull_request.html_url;

      const slack = new Slack(SLACK_API_TOKEN);

      if (config.ableToMerge) {
        const pr = new PullRequest(options, GITHUB_API_TOKEN);
        const comments = await pr.getApproveComments(owner, repo, number, config.approveComments);

        if (config.repositories.indexOf(repo) !== -1 && comments.length >= config.numApprovers) {
          await slack.postMessage(config.slackUsers[`${user}`], url, config.message.ableToMerge);
        }
      }

      if (config.mentionComment) {
        const comment = PullRequest.parseMentionComment(payload.review.body, payload.review.html_url);
        if (comment.hasOwnProperty('mentionUsers')) {
          comment.mentionUsers.forEach(async (mentionUser) => {
            await slack.postMessage(config.slackUsers[`${mentionUser}`], comment.url, config.message.mentionComment);
          });
        }
      }
    } catch (error) {
      return callback(new Error(error.message));
    }

    return callback(null, { message: 'Pull request review event processing has been completed' });
  }

  return callback(null, { message: `event of type ${githubEvent} was ignored.` });
};
