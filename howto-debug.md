# ts-node(typescript)デバッグ設定(VSCode)

1. [目的](#anchor1)
1. [launch.jsonについて](#anchor2)
1. [テスト対象のプログラムについて](#anchor3)
1. [対象プログラムを起動してデバッグ](#anchor4)
1. [起動中のnodeにアタッチしてデバッグ](#anchor5)
1. [おまけ：jestでテスト対象のプログラムをデバッグ](#anchor6)

## 目的 <a id="anchor1"></a>

* ts-nodeを利用した場合のデバッグ方法がよくわからなかったため、調べた結果をまとめました。
  * 起動中のプログラムにアタッチしてデバッグ
  * デバッガからプログラムを起動する
  * ユニットテスト(jest)のデバッグを行う


## launch.jsonについて <a id="anchor2"></a>

* VSCodeでデバッグを行う場合に必要(作成される)な設定ファイルです。
* 「./.vscode/launch.json」に下記をコピーすればデバッグできます。
  * ファイルがない場合は、デバッグボタンをクリックして作成してから内容を上書きしてください。

```json
{
  // require('ts-node').register() を使う場合のデバッグ設定
  "version": "0.2.0",
  "configurations": [
    {
      "type": "pwa-node",
      "request": "launch",
      "name": "nodeプログラムを起動してデバッグ",
      "skipFiles": [
        "<node_internals>/**"
      ],
      "program": "${workspaceFolder}\\bin\\www",
      "outFiles": [
        "${workspaceFolder}/**/*.js"
      ],
      "resolveSourceMapLocations": [
        "${workspaceFolder}/**",
        "!**/node_modules/**"
      ]
    },
    {
      "type": "pwa-node",
      "request": "attach",
      "name": "実行中のnodeプログラムにアタッチしてデバッグ",
      "processId": "${command:PickProcess}",      
    },   
    {
      "type": "node",
      "name": "Jestのテストコードをデバッグ",      
      "request": "launch",
      "runtimeArgs": [
        "--inspect-brk",
        "${workspaceRoot}/node_modules/jest/bin/jest.js",
        "--runInBand"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "port": 9229
    }
  ]
}
```

## テスト対象のプログラムについて <a id="anchor3"></a>

githubにあるこのサンプルで試すことができます
[Expressをディレクトリ構成変えずに最小限の手間でTypescriptにする手順](https://github.com/murasuke/express-generator-tsnode)

* 任意のフォルダにcloneしてから、必要なモジュールをインストール(npm install)します。

```bash
git clone https://github.com/murasuke/express-generator-tsnode
cd express-generator-tsnode/
npm install
```

* **実行とデバッグ**ボタンを押して「launch.json」ファイルを作成し、上記ソースを貼り付けます。

## 対象プログラムを起動してデバッグ <a id="anchor4"></a>

```json
{
  "type": "pwa-node",  // 利用するデバッガの種類をVSCodeに伝える。"node"でも良いが、"pwa-node"の方が新しいデバッガのためこちらを利用(progressive web apps とは関係ない)
  "request": "launch", // デバッガ起動時に、対象プログラム("program")を起動する
  "name": "nodeプログラムを起動してデバッグ",
  "skipFiles": [   // ステップイン対象外ファイル
    "<node_internals>/**"  // Node.jsの組み込みコアモジュールを対象外とする
  ],
  "program": "${workspaceFolder}\\bin\\www",  // デバッガ起動時の実行対象ファイル
  "outFiles": [
    "${workspaceFolder}/**/*.js"  // トランスパイル後のアウトプット先フォルダー(ts-nodeはどこに出力しているか明確にわかりませんでしたが、これで問題なくデバッグできています)
  ],
  "resolveSourceMapLocations": [
    "${workspaceFolder}/**", // souce map(tsファイルとjsファイルの行の位置をマッピングするファイル)を読み込み、位置の解決を行うファイルの指定
    "!**/node_modules/**"  // 「Could not read source map for ～」というエラーを回避するため(node_modules配下はsouce mapの解決を行わないように指定する)
  ]
},
```
* resolveSourceMapLocationsの設定は下記issuresを参照
  * https://github.com/microsoft/vscode/issues/102042

## 起動中のnodeにアタッチしてデバッグ <a id="anchor5"></a>

```json
{
  "type": "pwa-node", // 利用するデバッガの種類をVSCodeに伝える。
  "request": "attach",  // 起動中のプログラム(node)にアタッチしてデバッグする
  "name": "実行中のnodeプログラムにアタッチしてデバッグ",
  "processId": "${command:PickProcess}",  // デバッグ開始時、プロセスのピッカーを表示(デバッグ対象のnodeプロセスを選択する)
},   
```

## おまけ：jestでテスト対象のプログラムをデバッグ <a id="anchor6"></a>

* これで.test.tsファイルのデバッグできました

```json
    {
      "type": "node",
      "name": "Jestのテストコードをデバッグ",      
      "request": "launch",
      "runtimeArgs": [
        "--inspect-brk",
        "${workspaceRoot}/node_modules/jest/bin/jest.js",
        "--runInBand"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "port": 9229
    }
```
