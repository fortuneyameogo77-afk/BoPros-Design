
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const messages = document.getElementById("messages");

const WORKER_URL = "https://bopros-ai.fortuneyameogo77.workers.dev";
const TIMEOUT_MS = 30000;

function addMessage(text, sender) {
  const message = document.createElement("div");
  message.className = `message ${sender}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = sender === "user" ? "Vous" : "BP";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  message.append(avatar, bubble);
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;

  return message;
}

async function sendMessage(text) {
  const question = text.trim();
  if (!question || userInput.disabled) return;

  addMessage(question, "user");
  userInput.value = "";
  userInput.disabled = true;

  const loadingMessage = addMessage("Je réfléchis...", "assistant");
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: question }),
      signal: controller.signal
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || `Erreur du serveur (${response.status}).`
      );
    }

    if (!data.answer) {
      throw new Error("Le serveur n'a pas renvoyé de réponse.");
    }

    loadingMessage.querySelector(".bubble").textContent = data.answer;

  } catch (error) {
    console.error("Erreur BoPros AI :", error);

    if (error.name === "AbortError") {
      loadingMessage.querySelector(".bubble").textContent =
        "La réponse prend trop de temps. Réessaie dans quelques instants.";
    } else {
      loadingMessage.querySelector(".bubble").textContent =
        "Désolé, je n'arrive pas à répondre pour le moment. Réessaie plus tard.";
    }

  } finally {
    clearTimeout(timeout);
    userInput.disabled = false;
    userInput.focus();
  }
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(userInput.value);
});

document.querySelectorAll("[data-question]").forEach((button) => {
  button.addEventListener("click", () => {
    sendMessage(button.dataset.question);
  });
});
