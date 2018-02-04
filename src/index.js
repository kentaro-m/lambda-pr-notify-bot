import crypto from 'crypto';
import { handlePullRequestEvent, handlePullRequestReviewEvent, handleIssueEvent } from './handler';

const SECRET_TOKEN = process.env.SECRET_TOKEN || '';
const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN || '';
const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN || '';

function calculateSignature(secret, payload) {
  return `sha1=${crypto.createHmac('sha1', secret).update(payload, 'utf-8').digest('hex')}`;
}

function validateSignature(githubSignature, calculatedSignature) {
  return githubSignature === calculatedSignature;
}

exports.handler = async (event, context, callback) => {
  const githubEvent = event.headers['X-GitHub-Event'];
  const signature = event.headers['X-Hub-Signature'];
  const payload = event.body;

  if (!SECRET_TOKEN) {
    callback(new Error('Secret Token is not found.'));
  }

  if (!SLACK_API_TOKEN) {
    callback(new Error('Slack API Token is not found.'));
  }

  if (!GITHUB_API_TOKEN) {
    callback(new Error('GitHub API Token is not found.'));
  }

  const calculatedSignature = calculateSignature(SECRET_TOKEN, JSON.stringify(payload));

  const isValid = validateSignature(signature, calculatedSignature);
  if (!isValid) {
    callback(new Error('X-Hub-Signature and Calculated Signature do not match.'));
  }

  if (githubEvent === 'pull_request') {
    await handlePullRequestEvent(payload, callback);
  } else if (githubEvent === 'pull_request_review') {
    await handlePullRequestReviewEvent(payload, callback);
  } else if (githubEvent === 'issue_comment') {
    await handleIssueEvent(payload, callback);
  }

  callback(null, { message: `event of type ${githubEvent} was ignored.` });
};
