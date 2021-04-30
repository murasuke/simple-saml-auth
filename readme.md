# SAMLによるシングルサインオンサンプル(node-expressとsaml-idp利用)
1. [目的](#anchor0)
1. [express-generatorでひな形作成](#anchor1)
1. [利用モジュールのインストール](#anchor2)
1. [TypeScript化](#anchor3)
1. [テスト用ページ作成](#anchor4)
1. [認証用Route設定](#anchor5)
1. [テスト用IdPの設定](#anchor6)
1. [動作確認](#anchor7)

## 1:目的と概要 <a id="anchor0"></a>

  * テスト用IdPを使い、saml認証を行います。
  * トップページは認証不要、認証が必要ページに遷移する場合は認証画面を表示します。
  * ログイン、ログアウト機能を持ちます

## 2:express-generatorでひな形作成 <a id="anchor1"></a>

  * express
    * express-generator でカレントフォルダにひな形を生成します

```bash
npx express-generator --view=ejs --git ./
```

下記ファイルが生成されます
```
  │  app.js
  │  package.json
  │  .gitignore
  ├─.vscode
  │      launch.json
  ├─bin
  │      www
  ├─public
  │  ├─images
  │  ├─javascripts
  │  └─stylesheets
  │          style.css
  ├─routes
  │      index.js
  │      users.js
  └─views
         error.ejs
         index.ejs
```

   * package.jsonに記載されたモジュールをインストールします。

```bash
npm install
```

  * 動作確認のため、ターミナルで下記を実行し「localhost:3000」を開きます。
  ブラウザで開き「Welcome to Express」と表示されたら成功です。

```
npm run start
```


----
## 3:利用モジュールのインストール <a id="anchor2"></a>

  * 必要なモジュール(と型定義)をインストールします(TypeScript関連)

```bash
npm i -D typescript nodemon @types/cookie-parser @types/express
npm i ts-node express-session
```


  * passportとpassport-samlを追加(nodeの認証用モジュール)

```bash
npm i passport passport-saml
npm i -D @types/passport
```

  * インストール後のpackage.json (概ねこのようなファイルになっていると思います）

```json
{
  "name": "simple-saml-auth",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "start": "node ./bin/www"
  },
  "dependencies": {
    "cookie-parser": "~1.4.4",
    "debug": "~2.6.9",
    "ejs": "~2.6.1",
    "express": "~4.16.1",
    "express-session": "^1.17.1",
    "http-errors": "~1.6.3",
    "morgan": "~1.9.1",
    "passport": "^0.4.1",
    "passport-saml": "^2.2.0",
    "ts-node": "^9.1.1"
  },
  "devDependencies": {
    "@types/cookie-parser": "^1.4.2",
    "@types/express": "^4.17.11",
    "@types/passport": "^1.0.6",
    "nodemon": "^2.0.7",
    "saml-idp": "^1.2.1",
    "typescript": "^4.2.4"
  }
}
```

## 4:TypeScript化 <a id="anchor3"></a>

1. Typescriptの設定ファイルを作成します(tsconfig.json)
  ```bash
  npx tsc --init
  ```

2. 生成されたjsファイルの拡張子を全て「ts」に変更します
```bash
mv app.js app.ts
mv ./routes/index.js ./routes/index.ts
mv ./routes/users.js ./routes/users.ts
mv ./bin/www ./bin/www.ts
```

3. ./bin フォルダに「www.js」を追加し下記の内容を追記します。
```bash
touch ./bin/www.js
echo -e "require('ts-node').register({transpileOnly: true});\nrequire('./www.ts');" > ./bin/www.js
```
「{transpileOnly: true}」は、起動を高速化するため(型チェックを行いません)

 　⇒型チェックはエディタ側に任せて、トランスパイルに専念させます。

4. tsconfig.json 下記行のコメントを1行外しfalseに変更します。
(元がjsのため型指定のない変数を許可しないとコンパイルエラーとなるためです。
trueに戻して適切に型を付けると安全性が向上します)
```json
"noImplicitAny": false,
```

5. typescript化したexpressアプリケーションが起動することを確認します。

```bash
npm run start
```

* 現時点(require()での読み込み)では、型推論が行われないためimportに変更ます。型チェック、オートコンプリートが行われるようになります。
  * require() ⇒ import
  * module.exports ⇒ export default

### 変更例(index.ts)
```typescript
// var express = require('express');
import express from 'express';
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// importでもrequire()でも読み込めるようにmodule.exportを残しておきます
module.exports = router;
export default router;
```

## 5:テスト用ページ作成 <a id="anchor4"></a>
viewsフォルダのファイルを追加、修正する。

  * トップページ(認証不要) 「index.ejs」 を修正。
    * ログイン時、ユーザ名、ログアウト認証が必要なページ(page1)への表示
    * 未ログイン時、ログイン、認証が必要なページ(page1)へのリンク
```html
<!DOCTYPE html>
<html>
  <head>
    <title>トップページ(認証不要)</title>
    <link rel='stylesheet' href='/stylesheets/style.css' />
  </head>
  <body>
    <div>
      トップページ(認証不要)
      <p>
      <% if (uid) { %>
        ユーザ名[<%= uid %>] <a href='/logout'>ログアウト</a> 
      <% } else { %>
        <a href='/login'>ログイン</a>
      <% } %>
      </p>   
    </div>
    <div>
       <p><a href='/page1'>ログインが必要なページ</a></p>
    </div>
  </body>
</html>
```

  * 認証が必要なページ 「page1.ejs」 を新規追加。
    * ユーザ名の表示、トップページへのリンク
```html
<!DOCTYPE html>
<html>
  <head>
    <title>認証が必要なテストページ</title>
    <link rel='stylesheet' href='/stylesheets/style.css' />
  </head>
  <body>
    <div>
      認証が必要なテストページ
      <p>ユーザ名[<%= uid %>]</p>
    </div>    
    <div>
       <p><a href='/'>トップページへ戻る</a></p>
    </div>
  </body>
</html>
```

## 6:認証用Route設定 <a id="anchor5"></a>
* auth.ts追加
  * ユーザーのシリアライズ、デシリアライズ処理

```javascript
// sessionへのシリアライズ、デシリアライズ処理
// saml認証で受け取った値をそのままセットしている
// idだけをセッションに保存し、デシリアライズ時にDBから復元するなどの処理を行う
passport.serializeUser<any>((user, done) => {
  done(null, user);
});

passport.deserializeUser<any>((user, done) => {
  done(null, user);
});
```

  * saml認証用のStrategy設定
```javascript
// saml認証用の設定
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
passport.use(samlStrategy);
```

  * ログイン処理
  
```javascript
   router.get('/login', authModule, (req, res) => {
   res.redirect('/');
 });
```
  
* ログイン処理
  
```javascript
 /**
  * idpで認証後のコールバックURL
  * ・この時点で、認証されたユーザ情報が「req.user」にセットされる
  * ・リクエスト時のURLにリダイレクトする
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
```
  
* ログイン失敗時の処理
  
```javascript
router.get('/login/fail', (req, res) => {
  res.status(401).send('Login failed');
});

  ```
  
* ログアウト
  
```javascript
/**
* ログアウト
* ・'/'にアクセスしても、認証情報がないため再度認証画面へ飛ばされる。
*/
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});
  ```
   
* 認証チェック
  
```javascript
// 認証無しで許可するパス(チェックは手抜きです。適切に書き換えてください)
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
  // リクエストされたurlをセッションに保存してから、idpへ認証を依頼
  (req as any).session.requestUrl = req.url;
  return authModule(req, res, next);
});
 
```


  * app.tsに組み込み

  ページ表示時、認証が先に行われるようにするため「認証モジュールの組み込み」を先に行います。

```typescript
// samlによる認証処理
app.use(session({secret: 'paosiduf'}));
app.use(samlPassport.initialize());
app.use(samlPassport.session());
app.use(samlAuth);

// 認証モジュールの後にルートを追加する(先に認証チェックを行うため)
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/page1', page1);
```

## 7:テスト用IdP(saml-idp)の設定 <a id="anchor6"></a>
  * saml-idpをpackage.jsonへ追加 (https://www.npmjs.com/package/saml-idp)

  コマンドラインから起動できるテスト用のIdP（Identity Provider）です。

```bash
npm i -D saml-idp
```

  * IdP用証明書ファイル作成
    * 作成したファイルをプロジェクトルートに配置します。(ルートディレクトリでコマンドを実行すれば、コピーする必要はありません)

```bash
openssl req -x509 -new -newkey rsa:2048 -nodes  -keyout idp-private-key.pem -out idp-public-cert.pem -days 7300
Generating a RSA private key
```

  * Country Name(国名), State or Province Name(県名), Locality Name(都市名)などは、テスト用途なので適当に入力してください。
  * 出力するファイル名(idp-public-cert.pem)は、saml-idpのデフォルト名を指定しています。変更する場合は、起動時のコマンドライン指定を修正する必要があります。

作成コマンドサンプル

```
$ openssl req -x509 -new -newkey rsa:2048 -nodes  -keyout idp-private-key.pem -out idp-public-cert.pem -days 7300
Generating a RSA private key
.....+++++
......+++++
writing new private key to 'idp-private-key.pem'
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:JP
State or Province Name (full name) [Some-State]:Aichi
Locality Name (eg, city) []:Nagoya
Organization Name (eg, company) [Internet Widgits Pty Ltd]:
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:Test Identity Provider
Email Address []:tkyk.niimura@gmail.com
```

  * 起動用スクリプト登録
    * package.jsonの"scripts"に、テスト用IdP起動スクリプトを追加します。

```json
"saml-idp": "saml-idp --acs http://localhost:7000/auth/saml --aud mock-audience"
```

## 8:動作確認 <a id="anchor7"></a>
  * テスト用Idpサーバ(saml-idp)を起動します

```bash
$ npm run saml-idp

> simple-saml-auth@0.0.0 saml-idp C:\Users\t_nii\Documents\git\auth\simple-saml-auth
> saml-idp --acs http://localhost:7000/auth/saml --aud mock-audience

Listener Port:  
  localhost:7000
HTTPS Enabled:
  false

[Identity Provider]

Issuer URI:
  urn:example:idp
Sign Response Message:
  true
Encrypt Assertion:
  false
Authentication Context Class Reference:
  urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport
Authentication Context Declaration:
  None
Default RelayState:
  None

[Service Provider]

Issuer URI:
  None
Audience URI:
  mock-audience
ACS URL:
  http://localhost:7000/auth/saml
SLO URL:
  None
Trust ACS URL in Request:
  true

Starting IdP server on port localhost:7000...

IdP Metadata URL:
  http://localhost:7000/metadata

SSO Bindings:
  urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST
    => http://localhost:7000/saml/sso
  urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect
    => http://localhost:7000/saml/sso

IdP server ready at
  http://localhost:7000
```


  * プログラムを起動します

```bash
npm run start
```

##＃ 動作確認

* トップページを表示(localhost:3000)
  * 認証不要のため、ログイン画面は表示されません


* ログインが必要なページを表示(localhost:3000/page1)
  * ログイン画面が表示される。「Sign in」を押下すると「/page1」にダイレクトし、ユーザ名が表示される。

* 一度ログインした後はログイン画面が表示されない。

* トップページから「ログアウト(localhost:3000/logout)」すると、再度ログインが必要となる。
