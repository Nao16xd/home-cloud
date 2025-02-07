const msalConfig = {
    auth: {
        clientId: "314e0eee-2ed8-48aa-b5e5-0cae833078de",  // Azure AD アプリのクライアントID
        authority: "https://login.microsoftonline.com/395a39e9-39d1-42c3-8733-b9b1c4157606",
        redirectUri: "http://localhost:5501"  // Live Server用
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

// ページ読み込み時に自動的にログイン処理
async function handleRedirectResponse() {
    try {
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
            console.log("リダイレクト後のログイン成功:", response);
            // ここでは表示処理は行わず、セッションストレージに保存
            await getAccessTokenAndFetchUser();
        } else {
            // リダイレクト結果がない場合はログインを開始
            await msalInstance.loginRedirect({ scopes: ["User.Read", "User.ReadBasic.All"] });
        }
    } catch (error) {
        console.error("リダイレクトログイン失敗:", error);
    }
}

// ページ読み込み時に自動的にリダイレクトの結果を処理
handleRedirectResponse();

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
    }
}

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
        
        // セッションストレージに保存
        sessionStorage.setItem("userInfo", JSON.stringify(user));
    } else {
        console.error("ユーザー情報取得エラー:", response.statusText);
    }
}