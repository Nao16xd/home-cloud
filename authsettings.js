const clientId = '314e0eee-2ed8-48aa-b5e5-0cae833078de'; // Azure AD アプリケーションのクライアントID
const tenantId = '395a39e9-39d1-42c3-8733-b9b1c4157606'; // テナントID
const redirectUri = 'http://localhost:5501'; // リダイレクトURI（Azure ADに設定されているもの）

// 認証URLの構築
const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=User.Read`;

// Microsoft Graph APIから情報を取得する関数
function fetchGraphData() {
  // 認証トークンをセッションストレージから取得
  const token = sessionStorage.getItem('access_token');
  
  if (token) {
    // Microsoft Graph APIにリクエストを送信
    fetch('https://graph.microsoft.com/v1.0/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('取得した情報:', data);
      // ここで必要な情報をセッションストレージに格納する
      sessionStorage.setItem('userData', JSON.stringify(data));
    })
    .catch(error => {
      console.error('APIの呼び出しエラー:', error);
    });
  } else {
    console.log('認証トークンが見つかりません。認証を開始します。');
    startAuthentication();
  }
}

// 認証処理を開始する関数
function startAuthentication() {
  window.location.href = authUrl;
}

// リダイレクトされた後にトークンをセッションストレージに格納する処理
if (window.location.hash) {
  const params = new URLSearchParams(window.location.hash.substring(1));
  const token = params.get('access_token');
  
  if (token) {
    sessionStorage.setItem('access_token', token);
    // トークンを使ってデータを取得
    fetchGraphData();
  } else {
    console.error('アクセストークンが取得できませんでした。');
  }
} else {
  // ページロード時にトークンがあるかチェック
  const token = sessionStorage.getItem('access_token');
  if (token) {
    fetchGraphData();
  } else {
    startAuthentication(); // トークンがない場合は認証処理を開始
  }
}