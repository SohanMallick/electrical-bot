function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createMessageMarkup(role, content) {
  const safeContent = escapeHtml(content).replaceAll("\n", "<br>");
  const label = role === "user" ? "Worker" : "Assistant";
  const warningClass = role === "bot" && /danger|warning|risk|emergency|shock/i.test(content)
    ? " warning"
    : "";

  return `
<article class="message ${role}${warningClass}">
  <span class="message-label">${label}</span>
  <div>${safeContent}</div>
</article>
`;
}

function removeEmptyState(chat) {
  const emptyState = chat.querySelector(".empty-state");

  if (emptyState) {
    emptyState.remove();
  }
}

async function sendMessage(event) {
  if (event) {
    event.preventDefault();
  }

  const input = document.getElementById("message");
  const chat = document.getElementById("chat");
  const sendButton = document.getElementById("send-button");

  if (
    !(input instanceof HTMLInputElement) ||
    !(chat instanceof HTMLElement) ||
    !(sendButton instanceof HTMLButtonElement)
  ) {
    console.error("Chat UI elements are missing.");
    return;
  }

  const message = input.value.trim();

  if (!message) {
    return;
  }

  removeEmptyState(chat);
  chat.insertAdjacentHTML("beforeend", createMessageMarkup("user", message));
  chat.scrollTop = chat.scrollHeight;
  input.value = "";
  input.focus();
  sendButton.disabled = true;
  sendButton.textContent = "Sending...";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
      }),
    });

    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    const data = await res.json();

    chat.insertAdjacentHTML("beforeend", createMessageMarkup("bot", data.reply));
  } catch (error) {
    console.error(error);
    chat.insertAdjacentHTML(
      "beforeend",
      createMessageMarkup("bot", "Unable to reach the server.")
    );
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = "Send";
  }

  chat.scrollTop = chat.scrollHeight;
}

document.querySelectorAll(".topic-chip").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById("message");

    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    input.value = button.dataset.prompt || "";
    input.focus();
  });
});
