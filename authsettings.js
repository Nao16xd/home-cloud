const msalConfig = {
    auth: {
        clientId: "314e0eee-2ed8-48aa-b5e5-0cae833078de",  // Azure AD アプリのクライアントID
        authority: "https://login.microsoftonline.com/395a39e9-39d1-42c3-8733-b9b1c4157606",
        redirectUri: "http://localhost:5501"  // Live Server用
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

async function handleRedirectResponse() {
    try {
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
            console.log("リダイレクト後のログイン成功:", response);
            document.getElementById("userInfo").textContent = "✅ ログイン成功しました";
            document.getElementById("loginButton").style.display = "none";
            document.getElementById("logoutButton").style.display = "block";
            await getAccessTokenAndFetchUser();
        }
    } catch (error) {
        console.error("リダイレクトログイン失敗:", error);
        document.getElementById("userInfo").textContent = `❌ ログインに失敗しました\n${error.message}`;
    }
}

// ページ読み込み時にリダイレクトの結果を処理
handleRedirectResponse();

document.getElementById("loginButton").addEventListener("click", async () => {
    try {
        await msalInstance.loginRedirect({ scopes: ["User.Read", "User.ReadBasic.All"] });
    } catch (error) {
        console.error("ログイン開始エラー:", error);
        document.getElementById("userInfo").textContent = `❌ ログインエラー\n${error.message}`;
    }
});

document.getElementById("logoutButton").addEventListener("click", async () => {
    try {
        await msalInstance.logoutRedirect();
        sessionStorage.removeItem("userProfile"); // ログアウト時にセッションストレージをクリア
        document.getElementById("userInfo").textContent = "🔓 ログアウトしました";
        document.getElementById("loginButton").style.display = "block";
        document.getElementById("logoutButton").style.display = "none";
    } catch (error) {
        console.error("ログアウトエラー:", error);
        document.getElementById("userInfo").textContent = `❌ ログアウトエラー\n${error.message}`;
    }
});

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

        // ユーザー情報をセッションストレージに格納
        sessionStorage.setItem("userProfile", JSON.stringify(user));

        document.getElementById("userInfo").textContent = `✅ ログイン成功\n\n` + JSON.stringify(user, null, 2);
    } else {
        console.error("ユーザー情報取得エラー:", response.statusText);
        document.getElementById("userInfo").textContent = `⚠️ ユーザー情報取得エラー\n${response.statusText}`;
    }
}
