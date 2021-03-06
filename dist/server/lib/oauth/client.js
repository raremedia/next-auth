"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = oAuthClient;

var _oauth = require("oauth");

var _querystring = _interopRequireDefault(require("querystring"));

var _logger = _interopRequireDefault(require("../../../lib/logger"));

var _jsonwebtoken = require("jsonwebtoken");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function oAuthClient(provider) {
  var _provider$version;

  if ((_provider$version = provider.version) !== null && _provider$version !== void 0 && _provider$version.startsWith('2.')) {
    var authorizationUrl = new URL(provider.authorizationUrl);
    var basePath = authorizationUrl.origin;
    var authorizePath = authorizationUrl.pathname;
    var accessTokenPath = new URL(provider.accessTokenUrl).pathname;
    var oauth2Client = new _oauth.OAuth2(provider.clientId, provider.clientSecret, basePath, authorizePath, accessTokenPath, provider.headers);
    oauth2Client.getOAuthAccessToken = getOAuth2AccessToken;
    oauth2Client.get = getOAuth2;
    return oauth2Client;
  }

  var oauth1Client = new _oauth.OAuth(provider.requestTokenUrl, provider.accessTokenUrl, provider.clientId, provider.clientSecret, provider.version || '1.0', provider.callbackUrl, provider.encoding || 'HMAC-SHA1');
  var originalGet = oauth1Client.get.bind(oauth1Client);

  oauth1Client.get = function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return new Promise((resolve, reject) => {
      originalGet(...args, (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      });
    });
  };

  var originalGetOAuth1AccessToken = oauth1Client.getOAuthAccessToken.bind(oauth1Client);

  oauth1Client.getOAuthAccessToken = function () {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return new Promise((resolve, reject) => {
      originalGetOAuth1AccessToken(...args, (error, accessToken, refreshToken, results) => {
        if (error) {
          return reject(error);
        }

        resolve({
          accessToken,
          refreshToken,
          results
        });
      });
    });
  };

  var originalGetOAuthRequestToken = oauth1Client.getOAuthRequestToken.bind(oauth1Client);

  oauth1Client.getOAuthRequestToken = function () {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    return new Promise((resolve, reject) => {
      originalGetOAuthRequestToken(...args, (error, oauthToken) => {
        if (error) {
          return reject(error);
        }

        resolve(oauthToken);
      });
    });
  };

  return oauth1Client;
}

function getOAuth2AccessToken(_x, _x2, _x3) {
  return _getOAuth2AccessToken.apply(this, arguments);
}

function _getOAuth2AccessToken() {
  _getOAuth2AccessToken = _asyncToGenerator(function* (code, provider, codeVerifier) {
    var url = provider.accessTokenUrl;

    var params = _objectSpread({}, provider.params);

    var headers = _objectSpread({}, provider.headers);

    var codeParam = params.grant_type === 'refresh_token' ? 'refresh_token' : 'code';

    if (!params[codeParam]) {
      params[codeParam] = code;
    }

    if (!params.client_id) {
      params.client_id = provider.clientId;
    }

    if (provider.id === 'apple' && typeof provider.clientSecret === 'object') {
      var {
        keyId,
        teamId,
        privateKey
      } = provider.clientSecret;
      var clientSecret = (0, _jsonwebtoken.sign)({
        iss: teamId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400 * 180,
        aud: 'https://appleid.apple.com',
        sub: provider.clientId
      }, privateKey.replace(/\\n/g, '\n'), {
        algorithm: 'ES256',
        keyid: keyId
      });
      params.client_secret = clientSecret;
    } else {
      params.client_secret = provider.clientSecret;
    }

    if (!params.redirect_uri) {
      params.redirect_uri = provider.callbackUrl;
    }

    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    if (!headers['Client-ID']) {
      headers['Client-ID'] = provider.clientId;
    }

    if (provider.id === 'reddit') {
      headers.Authorization = 'Basic ' + Buffer.from(provider.clientId + ':' + provider.clientSecret).toString('base64');
    }

    if (provider.id === 'identity-server4' && !headers.Authorization) {
      headers.Authorization = "Bearer ".concat(code);
    }

    if (provider.protection === 'pkce') {
      params.code_verifier = codeVerifier;
    }

    var postData = _querystring.default.stringify(params);

    return new Promise((resolve, reject) => {
      this._request('POST', url, headers, postData, null, (error, data, response) => {
        if (error) {
          _logger.default.error('OAUTH_GET_ACCESS_TOKEN_ERROR', error, data, response);

          return reject(error);
        }

        var raw;

        try {
          raw = JSON.parse(data);
        } catch (_unused) {
          raw = _querystring.default.parse(data);
        }

        var accessToken = provider.id === 'slack' ? raw.authed_user.access_token : raw.access_token;
        resolve(_objectSpread({
          accessToken,
          accessTokenExpires: null,
          refreshToken: raw.refresh_token,
          idToken: raw.id_token
        }, raw));
      });
    });
  });
  return _getOAuth2AccessToken.apply(this, arguments);
}

function getOAuth2(_x4, _x5, _x6) {
  return _getOAuth.apply(this, arguments);
}

function _getOAuth() {
  _getOAuth = _asyncToGenerator(function* (provider, accessToken, results) {
    var url = provider.profileUrl;

    var headers = _objectSpread({}, provider.headers);

    if (this._useAuthorizationHeaderForGET) {
      headers.Authorization = this.buildAuthHeader(accessToken);

      if (['mailru', 'vk'].includes(provider.id)) {
        var safeAccessTokenURL = new URL(url);
        safeAccessTokenURL.searchParams.append('access_token', accessToken);
        url = safeAccessTokenURL.href;
      }

      if (provider.id === 'twitch') {
        headers['Client-ID'] = provider.clientId;
      }

      accessToken = null;
    }

    if (provider.id === 'bungie') {
      url = prepareProfileUrl({
        provider,
        url,
        results
      });
    }

    return new Promise((resolve, reject) => {
      this._request('GET', url, headers, null, accessToken, (error, profileData) => {
        if (error) {
          return reject(error);
        }

        resolve(profileData);
      });
    });
  });
  return _getOAuth.apply(this, arguments);
}

function prepareProfileUrl(_ref) {
  var _provider$headers;

  var {
    provider,
    url,
    results
  } = _ref;

  if (!results.membership_id) {
    throw new Error('Expected membership_id to be passed.');
  }

  if (!((_provider$headers = provider.headers) !== null && _provider$headers !== void 0 && _provider$headers['X-API-Key'])) {
    throw new Error('The Bungie provider requires the X-API-Key option to be present in "headers".');
  }

  return url.replace('{membershipId}', results.membership_id);
}