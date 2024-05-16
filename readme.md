# シンプルなファイルアップロードツール

---あ

起動：

```sh
deno run --allow-all server.ts --port 8000 --cert dummy-cert --key dummy-key
```

- ポートはデフォルトでも 8000
- HTTPS にしないなら --cert と --key は要らない
- dummy-cert と dummy-key は自己署名のもの

---

使い方：

- サーバーにブラウザでアクセスして、画面の通りにファイルをドロップするとアップロードされる
- フォルダのアップロードはできないけど、複数ファイルのアップロードはできる
- 保存されるファイル名は・・・
	- タイムスタンプがフォルダ名 `2024-05-01_12-34-56-123`
	- 各ファイルは連番として保存される `0000`, `0001`, ...
	- 本来の名前を表す `index.txt` が作られる
		```
		0001: 元の名前.txt
		0002: image.png
		```
- 画面右側に成功や失敗のログを表示

---

サーバー：

- パスは関係なく、 GET リクエストならどこでも page.html がレスポンス、 POST リクエストならどこでもアップロード
- POST するデータのフォーマット
	```json
	{
		"NAME1": "BASE64文字列",
		"NAME2": "BASE64文字列"
	}
	```


