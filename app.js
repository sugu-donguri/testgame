const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

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
  const name = characterNameInput.value.trim();
  const strength = Number(strengthInput.value);

  if (!name) {
    alert("キャラクター名を入力してください。");
    return;
  }

  const { data, error } = await db
    .from("characters")
    .insert({
      user_id: "anonymous-test-user",
      name: name,
      stats: {
        strength: strength
      }
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
