const SUPABASE_URL = "https://wcdekipnhcmskmieyaij.supabase.co";
const SUPABASE_KEY = "sb_publishable_7SyUtBHnQDXvsvKywxIzFg_VelpqtPN";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const form = document.getElementById("chatForm");
const messages = document.getElementById("messages");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");

function addMessage(item) {
  const message = document.createElement("div");
  message.className = "message visitor";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = item.message;

  const time = document.createElement("span");
  time.textContent = item.name;

  message.appendChild(bubble);
  message.appendChild(time);
  messages.appendChild(message);

  messages.scrollTop = messages.scrollHeight;
}

async function loadMessages() {
  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  messages.innerHTML = "";
  data.forEach(addMessage);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const message = messageInput.value.trim();

  if (!name || !message) return;

  const { error } = await supabaseClient
    .from("messages")
    .insert({
      name: name,
      message: message
    });

  if (error) {
    console.error(error);
    alert("Message was not sent.");
    return;
  }

  messageInput.value = "";
  messageInput.focus();
});

supabaseClient
  .channel("messages-realtime")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages"
    },
    (payload) => {
      addMessage(payload.new);
    }
  )
  .subscribe();

loadMessages();
