import sinon from 'sinon';
import { assert } from 'chai';

import index from '../../src/index';
import readFixtures from '../../test/utils/fixtures';
import PullRequest from '../../src/pull_request';
import Slack from '../../src/slack';

/* global describe, it, beforeEach, afterEach */

describe('Index', () => {
  describe('Environment variable', () => {
    let callback;
    let event;
    let context;
    let env;

    beforeEach(() => {
      callback = sinon.spy();
      event = {
        headers: {
          'X-GitHub-Event': 'pull_request',
          'X-Hub-Signature': 'sha1=36e4d168d0d6c6bd92f639f830420ccd840d6214',
        },
        body: {

        },
      };
      context = {};
      env = Object.assign({}, process.env);
    });

    afterEach(() => {
      process.env = env;
    });

    it('can throw a secret token no set error', async () => {
      await index.handler(event, context, callback);
      assert.match(callback.args[0], /Secret Token is not found./);
    });

    it('can throw a slack api token no set error', async () => {
      process.env.SECRET_TOKEN = 'secret token';
      await index.handler(event, context, callback);
      assert.match(callback.args[0], /Slack API Token is not found./);
    });

    it('can throw a github api token no set error', async () => {
      process.env.SECRET_TOKEN = 'secret token';
      process.env.SLACK_API_TOKEN = 'slack api token';
      await index.handler(event, context, callback);
      assert.match(callback.args[0], /GitHub API Token is not found./);
    });
  });

  describe('calculateSignature', () => {
    let callback;
    let event;
    let context;
    let env;

    beforeEach(() => {
      callback = sinon.spy();
      event = {
        headers: {
          'X-GitHub-Event': 'pull_request',
          'X-Hub-Signature': 'sha1=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        },
        body: {

        },
      };
      context = {};
      env = Object.assign({}, process.env);
    });

    afterEach(() => {
      process.env = env;
    });

    it('can throw a secret token no set error', async () => {
      process.env.SECRET_TOKEN = 'secret token';
      process.env.SLACK_API_TOKEN = 'slack api token';
      process.env.GITHUB_API_TOKEN = 'github api token';
      await index.handler(event, context, callback);
      assert.match(callback.args[0], /X-Hub-Signature and Calculated Signature do not match./);
    });

    it('can throw a secret token no match error', async () => {
      process.env.SECRET_TOKEN = 'secret token';
      process.env.SLACK_API_TOKEN = 'slack api token';
      process.env.GITHUB_API_TOKEN = 'github api token';
      process.env.SECRET_TOKEN = 'secret token';
      await index.handler(event, context, callback);
      assert.match(callback.args[0], /X-Hub-Signature and Calculated Signature do not match./);
    });
  });

  describe('Pull Request Event', () => {
    let callback;
    let event;
    let context;
    let env;
    let sandbox;

    beforeEach(() => {
      callback = sinon.spy();
      context = {};
      process.env.SECRET_TOKEN = 'secret token';
      process.env.SLACK_API_TOKEN = 'slack api token';
      process.env.GITHUB_API_TOKEN = 'github api token';
      process.env.SECRET_TOKEN = 'secret token';
      env = Object.assign({}, process.env);
      sandbox = sinon.createSandbox();
      sandbox.stub(Slack.prototype, 'postMessage').returns(Promise.resolve({}));
    });

    afterEach(() => {
      process.env = env;
      sandbox.restore();
    });

    describe('handle a pull request event', () => {
      it('can send a review request message to reviewers using Slack', async () => {
        sandbox.stub(PullRequest.prototype, 'requestReview').returns(Promise.resolve({}));
        sandbox.stub(PullRequest.prototype, 'assignReviewers').returns(Promise.resolve({}));
        event = readFixtures('test/fixtures/request_review.json');
        await index.handler(event, context, callback);
        assert.equal(callback.args[0][1].message, 'Pull request event processing has been completed');
      });
    });

    describe('handle a pull request review event', () => {
      it('can send a able merge message to the author using Slack', async () => {
        const reviewComments = readFixtures('test/fixtures/review_comments_approved.json');
        sandbox.stub(PullRequest.prototype, 'getReviewComments').returns(Promise.resolve(reviewComments));
        event = readFixtures('test/fixtures/merge.json');
        await index.handler(event, context, callback);
        assert.equal(callback.args[0][1].message, 'Pull request review event processing has been completed');
      });

      it('can send a mention message to a member using Slack', async () => {
        const reviewComments = readFixtures('test/fixtures/review_comments_changed.json');
        sandbox.stub(PullRequest.prototype, 'getReviewComments').returns(Promise.resolve(reviewComments));
        event = readFixtures('test/fixtures/mention.json');
        await index.handler(event, context, callback);
        assert.equal(callback.args[0][1].message, 'Pull request review event processing has been completed');
      });
    });
  });
});
