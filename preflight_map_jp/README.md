# Pre-Flight Safety Support v6

## v6で変えたこと

### 1. Legal GateとOpenStreetMap取得を並列化
地点を分析すると、空港等周辺空域の確認と同時にOpenStreetMapの周辺環境データをバックグラウンド取得します。

### 2. OSM取得失敗でも法規確認をやり直さない
DID・緊急用務空域・重要施設等のチェック状態は、周辺環境データの取得失敗とは独立して保持されます。

### 3. 自動リトライ
Overpass APIの一時的な通信エラー、429、5xx、タイムアウト等は最大3回まで自動再試行します。

### 4. OSMが失敗してもCOMMON CHECKSへ進める
周辺環境データが取得できなくても、以下の基礎的な確認項目は利用できます。
- 風・突風
- 機体・プロペラ
- 通信・測位
- 飛行ルート・緊急時
- 現地の周辺確認

地点依存項目は「未取得」と明示されます。

### 5. 後から取得に成功したらBubbleを自動追加
COMMON CHECKSを確認中にOSM取得が成功した場合、建物・樹木・電力設備の地点依存Bubbleを自動で反映します。
風のSeverityが地点情報によってMajor→Hazardousへ変化した場合は、その風Bubbleを再確認対象に戻します。

### 6. キャッシュ
同じ地点付近を短時間に再分析した場合、30分以内の結果をsessionStorageから再利用し、Overpass APIへの不要な再問い合わせを減らします。

## デフォルト設定

```javascript
analysisRadiusMeters: 10,
bubbleSpeed: 0.01,
```

## FAA-based Severity

- No Safety Effect
- Minor
- Major
- Hazardous
- Catastrophic

Bubbleの大きさに反映しています。現在の割り当ては研究プロトタイプ用の暫定値です。

## DID

人口集中地区（DID）はLegal Gate内で国土地理院の参考レイヤーを表示します。
DIDの法的該当・非該当をこのアプリだけで自動確定せず、DIPS2.0等で最終確認してください。

## 起動方法

このフォルダで以下を実行してください。

```bash
python3 -m http.server 8080
```

ブラウザで以下を開きます。

```text
http://localhost:8080
```

## 注意

このシステムは研究用プロトタイプです。飛行の合法性・安全性を保証しません。
外部のOpenStreetMap / Overpass APIや国土地理院データの取得可否にも依存します。


## v7: Bubbleの色に意味を付与

- **青 = COMMON CHECK**: 飛行地点に関係なく毎回確認する基礎項目
- **オレンジ = LOCATION CHECK**: OpenStreetMapの周辺環境分析から、その地点に応じて追加された項目
- **Bubbleの大きさ = FAAのFailure Condition Severity分類を参考にした確認優先度**
- Legal Gateの黄色・赤系ステータスは法規・飛行制限上の注意としてBubbleとは分離

視覚変数の役割を分離し、`色 = なぜ表示されたか`、`大きさ = どれに強く注意を向けるか` としています。

デフォルト設定:
```javascript
analysisRadiusMeters: 10,
bubbleSpeed: 0.01,
```
