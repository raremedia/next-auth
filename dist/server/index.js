"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = NextAuth;

var _adapters = _interopRequireDefault(require("../adapters"));

var _jwt = _interopRequireDefault(require("../lib/jwt"));

var _parseUrl = _interopRequireDefault(require("../lib/parse-url"));

var _logger = _interopRequireWildcard(require("../lib/logger"));

var cookie = _interopRequireWildcard(require("./lib/cookie"));

var defaultEvents = _interopRequireWildcard(require("./lib/default-events"));

var defaultCallbacks = _interopRequireWildcard(require("./lib/default-callbacks"));

var _providers = _interopRequireDefault(require("./lib/providers"));

var _callbackUrlHandler = _interopRequireDefault(require("./lib/callback-url-handler"));

var _extendReq = _interopRequireDefault(require("./lib/extend-req"));

var routes = _interopRequireWildcard(require("./routes"));

var _pages = _interopRequireDefault(require("./pages"));

var _csrfTokenHandler = _interopRequireDefault(require("./lib/csrf-token-handler"));

var _createSecret = _interopRequireDefault(require("./lib/create-secret"));

var pkce = _interopRequireWildcard(require("./lib/oauth/pkce-handler"));

var state = _interopRequireWildcard(require("./lib/oauth/state-handler"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

if (!process.env.NEXTAUTH_URL) {
  _logger.default.warn('NEXTAUTH_URL', 'NEXTAUTH_URL environment variable not set');
}

function NextAuthHandler(_x, _x2, _x3) {
  return _NextAuthHandler.apply(this, arguments);
}

function _NextAuthHandler() {
  _NextAuthHandler = _asyncToGenerator(function* (req, res, userOptions) {
    if (userOptions.logger) {
      (0, _logger.setLogger)(userOptions.logger);
    }

    if (userOptions.debug) {
      process.env._NEXTAUTH_DEBUG = true;
    }

    return new Promise(function () {
      var _ref = _asyncToGenerator(function* (resolve) {
        var _provider$version, _userOptions$adapter;

        (0, _extendReq.default)(req, res, resolve);

        if (!req.query.nextauth) {
          var _error = 'Cannot find [...nextauth].js in pages/api/auth. Make sure the filename is written correctly.';

          _logger.default.error('MISSING_NEXTAUTH_API_ROUTE_ERROR', _error);

          return res.status(500).end("Error: ".concat(_error));
        }

        var {
          nextauth,
          action = nextauth[0],
          providerId = nextauth[1],
          error = nextauth[1]
        } = req.query;
        var multiTenantURL = null;

        if (process.env.MULTI_TENANT == "true") {
          var protocol = 'http';

          if (req.headers.referer && req.headers.referer.split("://")[0] == 'https' || req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === 'https') {
            protocol = 'https';
          }

          multiTenantURL = protocol + "://" + req.headers.host;
        }

        var {
          basePath,
          baseUrl
        } = (0, _parseUrl.default)(multiTenantURL || process.env.NEXTAUTH_URL || process.env.VERCEL_URL);

        var cookies = _objectSpread(_objectSpread({}, cookie.defaultCookies(userOptions.useSecureCookies || baseUrl.startsWith('https://'))), userOptions.cookies);

        var secret = (0, _createSecret.default)({
          userOptions,
          basePath,
          baseUrl
        });
        var {
          csrfToken,
          csrfTokenVerified
        } = (0, _csrfTokenHandler.default)(req, res, cookies, secret);
        var providers = (0, _providers.default)({
          providers: userOptions.providers,
          baseUrl,
          basePath
        });
        var provider = providers.find((_ref2) => {
          var {
            id
          } = _ref2;
          return id === providerId;
        });

        if (provider && provider.type === 'oauth' && (_provider$version = provider.version) !== null && _provider$version !== void 0 && _provider$version.startsWith('2') && !provider.protection && provider.state !== false) {
          provider.protection = 'state';
        }

        var maxAge = 30 * 24 * 60 * 60;
        var adapter = (_userOptions$adapter = userOptions.adapter) !== null && _userOptions$adapter !== void 0 ? _userOptions$adapter : userOptions.database && _adapters.default.Default(userOptions.database);
        req.options = _objectSpread(_objectSpread({
          debug: false,
          pages: {},
          theme: 'auto'
        }, userOptions), {}, {
          adapter,
          baseUrl,
          basePath,
          action,
          provider,
          cookies,
          secret,
          csrfToken,
          providers,
          session: _objectSpread({
            jwt: !adapter,
            maxAge,
            updateAge: 24 * 60 * 60
          }, userOptions.session),
          jwt: _objectSpread({
            secret,
            maxAge,
            encode: _jwt.default.encode,
            decode: _jwt.default.decode
          }, userOptions.jwt),
          events: _objectSpread(_objectSpread({}, defaultEvents), userOptions.events),
          callbacks: _objectSpread(_objectSpread({}, defaultCallbacks), userOptions.callbacks),
          pkce: {},
          logger: _logger.default
        });
        yield (0, _callbackUrlHandler.default)(req, res);
        var render = (0, _pages.default)(req, res);
        var {
          pages
        } = req.options;

        if (req.method === 'GET') {
          switch (action) {
            case 'providers':
              return routes.providers(req, res);

            case 'session':
              return routes.session(req, res);

            case 'csrf':
              return res.json({
                csrfToken
              });

            case 'signin':
              if (pages.signIn) {
                var signinUrl = "".concat(pages.signIn).concat(pages.signIn.includes('?') ? '&' : '?', "callbackUrl=").concat(req.options.callbackUrl);

                if (error) {
                  signinUrl = "".concat(signinUrl, "&error=").concat(error);
                }

                return res.redirect(signinUrl);
              }

              return render.signin();

            case 'signout':
              if (pages.signOut) {
                return res.redirect("".concat(pages.signOut).concat(pages.signOut.includes('?') ? '&' : '?', "error=").concat(error));
              }

              return render.signout();

            case 'callback':
              if (provider) {
                if (yield pkce.handleCallback(req, res)) return;
                if (yield state.handleCallback(req, res)) return;
                return routes.callback(req, res);
              }

              break;

            case 'verify-request':
              if (pages.verifyRequest) {
                return res.redirect(pages.verifyRequest);
              }

              return render.verifyRequest();

            case 'error':
              if (pages.error) {
                return res.redirect("".concat(pages.error).concat(pages.error.includes('?') ? '&' : '?', "error=").concat(error));
              }

              if (['Signin', 'OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'EmailCreateAccount', 'Callback', 'OAuthAccountNotLinked', 'EmailSignin', 'CredentialsSignin'].includes(error)) {
                return res.redirect("".concat(baseUrl).concat(basePath, "/signin?error=").concat(error));
              }

              return render.error({
                error
              });

            default:
          }
        } else if (req.method === 'POST') {
          switch (action) {
            case 'signin':
              if (csrfTokenVerified && provider) {
                if (yield pkce.handleSignin(req, res)) return;
                if (yield state.handleSignin(req, res)) return;
                return routes.signin(req, res);
              }

              return res.redirect("".concat(baseUrl).concat(basePath, "/signin?csrf=true"));

            case 'signout':
              if (csrfTokenVerified) {
                return routes.signout(req, res);
              }

              return res.redirect("".concat(baseUrl).concat(basePath, "/signout?csrf=true"));

            case 'callback':
              if (provider) {
                if (provider.type === 'credentials' && !csrfTokenVerified) {
                  return res.redirect("".concat(baseUrl).concat(basePath, "/signin?csrf=true"));
                }

                if (yield pkce.handleCallback(req, res)) return;
                if (yield state.handleCallback(req, res)) return;
                return routes.callback(req, res);
              }

              break;

            case '_log':
              try {
                if (!userOptions.logger) return;
                var {
                  code = 'CLIENT_ERROR',
                  level = 'error',
                  message = '[]'
                } = req.body;

                _logger.default[level](code, ...JSON.parse(message));
              } catch (error) {
                _logger.default.error('LOGGER_ERROR', error);
              }

              return res.end();

            default:
          }
        }

        return res.status(400).end("Error: HTTP ".concat(req.method, " is not supported for ").concat(req.url));
      });

      return function (_x4) {
        return _ref.apply(this, arguments);
      };
    }());
  });
  return _NextAuthHandler.apply(this, arguments);
}

function NextAuth() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (args.length === 1) {
    return (req, res) => NextAuthHandler(req, res, args[0]);
  }

  return NextAuthHandler(...args);
}