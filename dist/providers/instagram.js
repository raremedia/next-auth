"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Instagram;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function Instagram(options) {
  return {
    id: 'instagram',
    name: 'Instagram',
    type: 'oauth',
    version: '2.0',
    scope: 'user_profile',
    params: {
      grant_type: 'authorization_code'
    },
    accessTokenUrl: 'https://api.instagram.com/oauth/access_token',
    authorizationUrl: 'https://api.instagram.com/oauth/authorize?response_type=code',
    profileUrl: 'https://graph.instagram.com/me?fields=id,username,account_type,name',

    profile(profile) {
      return _asyncToGenerator(function* () {
        return {
          id: profile.id,
          name: profile.username,
          email: null,
          image: null
        };
      })();
    }

  };
}