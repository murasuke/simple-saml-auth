/**
 * saml認証用モジュール
 * ・passportにSAML用のStrategyをセット
 * ・ルートを除くすべてのリソースに対して認証チェックする['/*']
 *   ⇒ 未認証の場合は/login へリダイレクト
 *   ⇒ 認証済みの場合は、アクセスしたURLを返す
 */
import express from 'express';
import passport from 'passport';
import { Strategy } from 'passport-saml';
import fs from 'fs';
import path from 'path';

export const samlPassport = passport;

// saml認証で受け取った値をそのまま利用する
passport.serializeUser<any>((user, done) => {
  done(null, user);
});

passport.deserializeUser<any>((user, done) => {
  done(null, user);
});

// samll認証用の設定
const samlStrategy = new Strategy(
  {
    // URL that goes from the Identity Provider -> Service Provider
    callbackUrl: 'http://localhost:3000/login/callback',
    // URL that goes from the Service Provider -> Identity Provider
    entryPoint: 'http://localhost:7000/saml/sso',
    
    issuer: 'saml_test_issuer',
    identifierFormat: undefined, // urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress

    // Identity Providerのサーバ証明書
    cert: fs.readFileSync('idp-public-cert.pem', 'utf8'),
    validateInResponseTo: false,
    disableRequestedAuthnContext: true,
  },
  (profile, done) => done(null, profile)
);

console.log(JSON.stringify(samlStrategy, null, '  '));
passport.use(samlStrategy);


const router = express.Router();
const authModule = passport.authenticate('saml', { failureRedirect: '/login/fail' });

 /**
  * ログイン処理
  */
 router.get('/login', authModule, (req, res) => {
   res.redirect('/');
 });
 
 
 /**
  * idpで認証後のコールバックURL
  * ⇒ユーザ情報が「req.user」にセットされている
  */
router.post('/login/callback', authModule, (req, res) => {
  console.log('/login/callback', req.user);
  if ((req as any).session) {
    res.redirect((req as any).session.requestUrl);
    delete (req as any).session.requestUrl;
  } else {
    res.redirect('/');
  }   
});
 
/**
* ログイン失敗時の処理
*/
router.get('/login/fail', (req, res) => {
  res.status(401).send('Login failed');
});

/**
* ログアウト
* ・'/'にアクセスしても、認証情報がないため再度認証画面へ飛ばされる。
*/
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});


const allowPaths = ['/stylesheets', '/images', '/javascript', '/favicon.ico'];
/**
* 認証チェック
* ・全てのReact側からの通信に対して、認証チェックを行う
*   ⇒認証されていない場合は、saml認証を行う
*/
router.all(['/*'], (req, res, next) => {
  if (req.isAuthenticated()) {
    console.log(`Authenticated:${JSON.stringify(req.user)}`);
    return next();
  }

  if (req.url === '/' ) {
    // topページは認証不要
    return next();
  }

  if (allowPaths.some((path) => req.url.startsWith(path))) {
    // 許可するパス
    return next();
  }

  console.log(`${req.url} Not authenticated. Redirect to /login`);
  (req as any).session.requestUrl = req.url;
  return authModule(req, res, next);
});
 
 export default router;
 