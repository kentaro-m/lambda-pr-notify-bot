import { assert } from 'chai';

import Slack from '../../src/slack';

/* global describe, it */

describe('Slack', () => {
  describe('constructor', () => {
    it('should initialize', () => {
      const slack = new Slack('dummy token');
      assert.instanceOf(slack, Slack);
    });
  });
});
