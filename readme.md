# SAMLによるシングルサインオンサンプル(node-expressとsaml-idp利用)
1. [目的](#anchor0)
1. [express-generatorでひな形作成](#anchor1)
1. [利用モジュールのインストール](#anchor2)
1. [TypeScript化](#anchor3)
1. [テスト用ページ作成](#anchor4)
1. [認証用Route設定](#anchor5)
1. [テスト用IdPの設定](#anchor6)
1. [動作確認](#anchor7)

## 1:目的 <a id="anchor0"></a>

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
----
## 3:利用モジュールのインストール <a id="anchor2"></a>
  * 必要なモジュール(と型定義)をインストールします(TypeScript関連)
```bash
npm i -D typescript nodemon @types/cookie-parser @types/express
npm i ts-node express-session
```
  * saml-idpを追加 (https://www.npmjs.com/package/saml-idp)

  コマンドラインから起動できるテスト用のIdP（Identity Provider）です。
```bash
npm i -D saml-idp
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


  * 動作確認のため、ターミナルで下記を実行し「localhost:3000」を開きます。
  「Welcome to Express」と表示されたら成功です。
```
npm run start
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
「{transpileOnly: true}」は、起動高速化のためです(型チェックを行いません)

 　⇒型チェックはエディタ側に任せて、トランスパイルに専念させます。

4. tsconfig.json 下記行のコメントを1行外しfalseに変更します。
(型指定のない変数を許可、後でtrueに戻すとより型安全性が向上します)
```json
"noImplicitAny": false,
```

5. これでtypescript化したexpressアプリケーションが動作します。
```bash
npm run start
```
* 現時点では、型推論が行われないため下記の変更を行います。型チェック、オートコンプリートが行われるようになります。
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

// importでもrequire()でも読み込めるように2種類export
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

  * app.tsに組み込み

## 7:テスト用IdP(saml-idp)の設定 <a id="anchor6"></a>
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

## 7:動作確認 <a id="anchor7"></a>
  * テスト用Idpサーバ(saml-idp)を起動します
```bash
npm run saml-idp
```
  * プログラムを起動します
```bash
npm run start
```