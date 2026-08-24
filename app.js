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
let characters = [];

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

  addLog(`${data.name}を保存しました。`);
  await loadCharacters();

  const select = document.getElementById("characterSelect");
  select.value = data.id;

  selectCharacter();
}
async function rollDice() {
  if (!characterId) {
    alert("先にキャラクターを選択してください。");
    return;
  }

  const result = Math.floor(Math.random() * 6) + 1;
  const description = `1d6の結果は ${result} でした。`;

  const { error } = await db
    .from("logs")
    .insert({
      character_id: characterId,
      dice_result: result,
      description: description,
    });

  if (error) {
    console.error("ログ保存エラー:", error);
    alert("ログ保存に失敗しました：" + error.message);
    return;
  }

  await loadLogs();
}
async function loadCharacters() {
  const {
    data: { user },
  } = await db.auth.getUser();

  const select = document.getElementById("characterSelect");
  const status = document.getElementById("selectedCharacterStatus");

  if (!user) {
    characters = [];
    characterId = null;

    select.innerHTML =
      '<option value="">ログインしてください</option>';

    status.textContent = "未ログイン";
    return;
  }

  const { data, error } = await db
    .from("characters")
    .select("id, name, stats, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("キャラクター取得エラー:", error);
    alert("キャラクター一覧の取得に失敗しました：" + error.message);
    return;
  }

  characters = data;
  select.innerHTML =
    '<option value="">キャラクターを選択してください</option>';

  for (const character of characters) {
    const option = document.createElement("option");

    option.value = character.id;
    option.textContent = character.name;

    select.appendChild(option);
  }

  characterId = null;
  status.textContent = "キャラクター未選択";
}
function selectCharacter() {
  const select = document.getElementById("characterSelect");
  const status = document.getElementById("selectedCharacterStatus");

  characterId = select.value || null;

  if (!characterId) {
    status.textContent = "キャラクター未選択";
    return;
  }

  const selected = characters.find(
    (character) => character.id === characterId
  );

  if (!selected) {
    status.textContent = "キャラクター未選択";
    return;
  }

  const strength = selected.stats?.strength ?? "未設定";

  status.textContent =
    `選択中：${selected.name}（筋力：${strength}）`;
  
  loadLogs();
}
async function loadLogs() {
  const logsElement = document.getElementById("logs");

  logsElement.innerHTML = "";

  if (!characterId) {
    logsElement.textContent =
      "キャラクターを選択してください。";
    return;
  }

  const { data, error } = await db
    .from("logs")
    .select("id, dice_result, description, created_at")
    .eq("character_id", characterId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("ログ取得エラー:", error);
    logsElement.textContent =
      "ログの取得に失敗しました：" + error.message;
    return;
  }

  if (data.length === 0) {
    logsElement.textContent = "まだログはありません。";
    return;
  }

  for (const log of data) {
    addLog(formatLog(log));
  }
}
function formatLog(log) {
  const date = new Date(log.created_at);
  const time = date.toLocaleString("ja-JP");

  return `[${time}] ${log.description}`;
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

document
  .getElementById("characterSelect")
  .addEventListener("change", selectCharacter);

document
  .getElementById("reloadCharacters")
  .addEventListener("click", loadCharacters);

db.auth.onAuthStateChange(async () => {
  await updateAuthStatus();
  await loadCharacters();
});

updateAuthStatus();
loadCharacters();
