# 必要なモジュールのインポート
Import-Module -Name SqlServer
Import-Module Microsoft.Graph.Authentication
Import-Module Microsoft.Graph.Users
Install-Module -Name SqlServer -Force -AllowClobber


# パラメータとしてSQL接続情報を指定
param (
    [string]$serverName,  # SQLサーバー名
    [string]$databaseName,  # データベース名
    [string]$userName,  # SQLユーザー名
    [string]$password  # SQLパスワード
)

# パラメータが指定されていない場合、デフォルト値を設定
if (-not $serverName) { $serverName = "m3hsuzukifunctiondb.database.windows.net" }
if (-not $databaseName) { $databaseName = "m3h-suzuki-0040" }
if (-not $userName) { $userName = "m3h-suzuki-functionDB" }
if (-not $password) { $password = "Kouhei0726" }

# 接続文字列を作成
$connectionString = "Server=$serverName;Database=$databaseName;User Id=$userName;Password=$password;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

# SQLクエリ
$query = "SELECT Azure_PR_subjectID FROM Azure_PR_table WHERE Azure_PR_subjectID = 'user124'"

# データベース接続とクエリの実行
try {
    # 接続を作成
    $connection = New-Object System.Data.SqlClient.SqlConnection
    $connection.ConnectionString = $connectionString
    $connection.Open()

    # 接続成功メッセージ
    Write-Output "Azure SQL Databaseに正常に接続できました。"

    # クエリの実行
    $command = $connection.CreateCommand()
    $command.CommandText = $query

    # 結果を取得
    $reader = $command.ExecuteReader()
    if ($reader.Read()) {
        $subjectID = $reader["Azure_PR_subjectID"]

        # 結果の出力
        Write-Output "対象ID: $subjectID"

        # Entra IDのパスワードリセットを実行
        $TenantId = "395a39e9-39d1-42c3-8733-b9b1c4157606"
        $ClientId = "8fe0c583-f930-4a67-bea7-adfad6ac140b"
        $ClientSecret = "..n8Q~z7SBA7TRynDzpUsiFoylq.SixsilpjBb.Y"
        $NewPassword = "NewSecurePassword123!"  # 新しいパスワード

        # Microsoft Graphに認証
        $GraphToken = Connect-MgGraph -TenantId $TenantId -ClientId $ClientId -ClientSecret $ClientSecret -Scopes "User.ReadWrite.All"

        # パスワードリセット用のパラメータを設定
        $PasswordProfile = @{
            forceChangePasswordNextSignIn = $false  # 次回サインイン時の変更を強制しない
            password = $NewPassword                # 新しいパスワード
        }

        # パスワードリセットの実行
        try {
            Update-MgUser -UserId $subjectID -PasswordProfile $PasswordProfile
            Write-Output "パスワードが正常にリセットされました: $subjectID"
        } catch {
            Write-Error "パスワードリセット中にエラーが発生しました: $_"
        }

        # セッションを終了
        Disconnect-MgGraph
    }
    else {
        Write-Output "対象ID 'user124' に関連するデータが見つかりませんでした。"
    }

    # リーダーと接続を閉じる
    $reader.Close()
    $connection.Close()
}
catch {
    # エラーメッセージ
    Write-Error "エラーが発生しました: $_"
} finally {
    # 接続が開いたままの場合に閉じる
    if ($connection.State -eq "Open") {
        $connection.Close()
    }
}
