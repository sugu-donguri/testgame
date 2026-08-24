const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
async function signUp() {
  const email = document
    .getElementById("signupEmail")
    .value
    .trim();

  const password = document
    .getElementById("signupPassword")
    .value;

  if (!email || !password) {
    alert("メールアドレスとパスワードを入力してください。");
    return;
  }

  const { data, error } = await db.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error("登録エラー:", error);
    alert("登録に失敗しました：" + error.message);
    return;
  }

  if (data.session) {
    alert("登録してログインしました。");
  } else {
    alert("登録しました。確認メールを確認してください。");
  }

  await updateAuthStatus();
}
async function signIn() {
  const email = document
    .getElementById("loginEmail")
    .value
    .trim();

  const password = document
    .getElementById("loginPassword")
    .value;

  if (!email || !password) {
    alert("メールアドレスとパスワードを入力してください。");
    return;
  }

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error("ログインエラー:", error);
    alert("ログインに失敗しました：" + error.message);
    return;
  }

  alert("ログインしました。");
  await updateAuthStatus();
}
async function signOut() {
  const { error } = await db.auth.signOut();

  if (error) {
    console.error("ログアウトエラー:", error);
    alert("ログアウトに失敗しました：" + error.message);
    return;
  }

  alert("ログアウトしました。");
  await updateAuthStatus();
}
async function updateAuthStatus() {
  const {
    data: { user }
  } = await db.auth.getUser();

  const status = document.getElementById("authStatus");
  const logoutButton = document.getElementById("logoutButton");

  if (user) {
    status.textContent = `ログイン中：${user.email}`;
    logoutButton.hidden = false;
  } else {
    status.textContent = "未ログイン";
    logoutButton.hidden = true;
  }
}

let characterId = null;

const characterNameInput =
  document.getElementById("characterName");

const strengthInput =
  document.getElementById("strength");

const logsElement =
  document.getElementById("logs");

function addLog(message) {
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  logsElement.appendChild(paragraph);
}
async function saveCharacter() {
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    alert("先にログインしてください。");
    return;
  }

  const name = characterNameInput.value.trim();
  const strength = Number(strengthInput.value);

  if (!name) {
    alert("キャラクター名を入力してください。");
    return;
  }

  const { data, error } = await db
    .from("characters")
    .insert({
      user_id: user.id,
      name: name,
      stats: {
        strength: strength,
      },
    })
    .select()
    .single();

  if (error) {
    console.error("キャラクター保存エラー:", error);
    alert("保存に失敗しました：" + error.message);
    return;
  }

  characterId = data.id;
  addLog(`${data.name}を保存しました。`);
}

async function rollDice() {
  if (!characterId) {
    alert("先にキャラクターを保存してください。");
    return;
  }

  const result = Math.floor(Math.random() * 6) + 1;
  const description = `1d6の結果は ${result} でした。`;

  const { error } = await db
    .from("logs")
    .insert({
      character_id: characterId,
      dice_result: result,
      description: description
    });

  if (error) {
    console.error("ログ保存エラー:", error);
    alert("ログ保存に失敗しました：" + error.message);
    return;
  }

  addLog(description);
}

document
  .getElementById("saveCharacter")
  .addEventListener("click", saveCharacter);

document
  .getElementById("rollDice")
  .addEventListener("click", rollDice);

document
  .getElementById("signupButton")
  .addEventListener("click", signUp);

document
  .getElementById("loginButton")
  .addEventListener("click", signIn);

document
  .getElementById("logoutButton")
  .addEventListener("click", signOut);

db.auth.onAuthStateChange((_event, _session) => {
  updateAuthStatus();
});

updateAuthStatus();
