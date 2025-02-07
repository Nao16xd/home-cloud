const msalConfig = {
    auth: {
        clientId: "314e0eee-2ed8-48aa-b5e5-0cae833078de",  // Azure AD アプリのクライアントID
        authority: "https://login.microsoftonline.com/395a39e9-39d1-42c3-8733-b9b1c4157606",
        redirectUri: "http://localhost:5501"  // Live Server用
        
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

// ページ読み込み時にリダイレクト後の処理を実行
async function handleRedirectResponse() {
    try {
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
            console.log("リダイレクト後のログイン成功:", response);
            document.getElementById("userInfo").textContent = "✅ ログイン成功しました";
            await getAccessTokenAndFetchUser();
        }
    } catch (error) {
        console.error("リダイレクトログイン失敗:", error);
        document.getElementById("userInfo").textContent = `❌ ログインに失敗しました\n${error.message}`;
    }
}

// 自動ログイン処理
async function autoLogin() {
    try {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            // 既にログイン済みならトークンを取得
            console.log("既存のアカウントを検出:", accounts[0]);
            await getAccessTokenAndFetchUser();
        } else {
            // 未ログインなら自動ログイン
            console.log("アカウントなし、自動ログイン開始");
            await msalInstance.loginRedirect({ scopes: ["User.Read", "User.ReadBasic.All"] });
        }
    } catch (error) {
        console.error("自動ログインエラー:", error);
    }
}

// トークンを取得し、ユーザー情報を取得
async function getAccessTokenAndFetchUser() {
    try {
        const account = msalInstance.getAllAccounts()[0];
        if (!account) {
            console.error("アカウントが見つかりません");
            return;
        }

        // トークン取得
        const tokenResponse = await msalInstance.acquireTokenSilent({
            scopes: ["User.Read", "User.ReadBasic.All"],
            account: account
        });

        await getUserProfile(tokenResponse.accessToken);
    } catch (error) {
        console.error("トークン取得エラー:", error);
        document.getElementById("userInfo").textContent = `❌ トークン取得エラー\n${error.message}`;
    }
}

// ユーザー情報を Microsoft Graph API から取得
async function getUserProfile(accessToken) {
    const graphEndpoint = "https://graph.microsoft.com/v1.0/me?$select=displayName,mail,department,companyName,jobTitle,officeLocation";

    const response = await fetch(graphEndpoint, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (response.ok) {
        const user = await response.json();
        console.log("ユーザー情報:", user);
        document.getElementById("userInfo").textContent = `✅ ログイン成功\n\n${JSON.stringify(user, null, 2)}`;
    } else {
        console.error("ユーザー情報取得エラー:", response.statusText);
        document.getElementById("userInfo").textContent = `⚠️ ユーザー情報取得エラー\n${response.statusText}`;
    }
}

// ページ読み込み時に自動ログイン処理を実行
window.onload = async () => {
    await handleRedirectResponse(); // リダイレクト後の処理
    await autoLogin(); // 自動ログイン処理
};
