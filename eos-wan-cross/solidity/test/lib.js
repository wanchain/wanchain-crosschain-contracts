const chai = require('chai')
  , assert = chai.assert
  , expect = chai.expect
  , should = chai.should();

function assertPartialMatch(expect, actual) {
  if (typeof(actual) === "object") {
      if (Array.isArray(actual)) {
          for (let i = 0; i < actual.length; i++) {
              assert.containsAllKeys(actual[i], expect[0]);
          }
      } else {
          assert.containsAllKeys(actual, expect);
      }
  } else {
      if (expect.hasOwnProperty('error')) {
          assert.equal(actual, expect);
      } else {
          assert.equal(typeof(actual), typeof(expect));
      }
  }
}

function assertFullMatch(expect, actual) {
  if (Array.isArray(expect)) {
      assert.sameDeepMembers(actual, expect);
  } else {
      assert.deepStrictEqual(actual, expect);
  }
}

function assertCommonEqual(x, y) {
  return assert.strictEqual(x, y, x + " should be equal " + y);
}

function assertNotDeepEqual(x, y) {
  return assert.notDeepEqual(x, y, x + " should be not equal " + y);
}

function assertExists(x) {
  return assert.exists(x, x + " should exist");
}

function assertNotExists(x) {
  return assert.notExists(x, x + " should not exist");
}

function assertIfError(err) {
  return assert.ifError(err);
}

function assertFail(err) {
  return assert.fail(err);
}

function assertInstanceOf(err) {
  return assert.instanceOf();
}

function assertInclude(container, finder, err) {
  return assert.include(container, finder, err);
}

function expectNotOwnProperty(Obj, property) {
  return expect(Obj).not.ownProperty(property);
}

function expectThrow(fn, err) {
  return expect(fn).throw(err);
}

function expectToThrow(fn, err) {
  return expect(fn).to.throw(err);
}

function expectToNotThrow(fn, err) {
  return expect(fn).to.not.throw(err);
}

function expectToBeAnInstanceOf(x, y) {
  return expect(x).to.be.an.instanceOf(y);
}

module.exports = {
  assertExists: assertExists,
  assertNotExists: assertNotExists,
  assertIfError: assertIfError,
  assertFail: assertFail,
  assertInclude: assertInclude,
  assertInstanceOf: assertInstanceOf,
  assertCommonEqual: assertCommonEqual,
  assertNotDeepEqual: assertNotDeepEqual,
  assertPartialMatch: assertPartialMatch,
  assertFullMatch: assertFullMatch,
  expectNotOwnProperty: expectNotOwnProperty,
  expectThrow: expectThrow,
  expectToThrow: expectToThrow,
  expectToNotThrow: expectToNotThrow,
  expectToBeAnInstanceOf: expectToBeAnInstanceOf,
};