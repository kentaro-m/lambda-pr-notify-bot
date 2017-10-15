import Promise from 'bluebird';
import { assert } from 'chai';
import config from 'config';

import PullRequest from '../../src/pull_request';
import readFixtures from '../../test/utils/fixtures';

/* global describe, it */

describe('PullRequest', () => {
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

  describe('constructor', () => {
    it('should initialize', () => {
      const pr = new PullRequest(options, 'dummy token');
      assert.instanceOf(pr, PullRequest);
    });
  });

  describe('getApproveComments', () => {
    it('can create an array of approved comments', () => {
      const reviewComments = readFixtures('test/fixtures/review_comments_approved.json');
      const approveComments = PullRequest.getApproveComments(reviewComments, config.approveComments);
      assert.equal(approveComments.length, 1);
    });
  });

  describe('parseMentionComment', () => {
    describe('including a user name in a comment', () => {
      it('can perse a mention comment', () => {
        const comment = '@taro request change';
        const results = PullRequest.parseMentionComment(comment, 'http://example.com/');

        const expected = {
          mentionUsers: ['taro'],
          url: 'http://example.com/',
        };

        assert.deepEqual(results, expected);
      });
    });

    describe('including multiple user names in a comment', () => {
      it('can perse a mention comment', () => {
        const comment = '@taro @ken request change';
        const results = PullRequest.parseMentionComment(comment, 'http://example.com/');

        const expected = {
          mentionUsers: ['taro', 'ken'],
          url: 'http://example.com/',
        };

        assert.deepEqual(results, expected);
      });
    });

    describe('not including a user name in a comment', () => {
      it('can perse a mention comment', () => {
        const comment = 'request change';
        const results = PullRequest.parseMentionComment(comment, 'http://example.com/');

        assert.deepEqual(results, {});
      });
    });
  });
});
