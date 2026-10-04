const form = document.getElementById("chatForm");

const messages = document.getElementById("messages");

const nameInput =
  document.getElementById("nameInput");

const messageInput =
  document.getElementById("messageInput");


form.addEventListener("submit", function(event) {

  event.preventDefault();

  const name =
    nameInput.value.trim();

  const text =
    messageInput.value.trim();

  if (!name || !text) {
    return;
  }


  const message =
    document.createElement("div");

  message.className =
    "message visitor";


  const bubble =
    document.createElement("div");

  bubble.className =
    "bubble";

  bubble.textContent =
    text;


  const time =
    document.createElement("span");

  time.textContent =
    name + " • Now";


  message.appendChild(bubble);

  message.appendChild(time);

  messages.appendChild(message);


  messages.scrollTop =
    messages.scrollHeight;


  messageInput.value = "";

  messageInput.focus();

});
