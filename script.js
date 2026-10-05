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
const voiceButton = document.getElementById("voiceButton");

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;


function addMessage(item) {

  const message = document.createElement("div");

  message.className =
    item.sender_type === "admin"
      ? "message visitor"
      : "message owner";


  if (item.message_type === "voice" && item.voice_url) {

    const audio = document.createElement("audio");

    audio.controls = true;
    audio.src = item.voice_url;

    message.appendChild(audio);

  } else {

    const bubble = document.createElement("div");

    bubble.className = "bubble";
    bubble.textContent = item.message;

    message.appendChild(bubble);
  }


  const time = document.createElement("span");

  time.textContent = item.name;

  message.appendChild(time);

  messages.appendChild(message);

  messages.scrollTop =
    messages.scrollHeight;
}


async function loadMessages() {

  const { data, error } =
    await supabaseClient
      .from("messages")
      .select("*")
      .order("created_at", {
        ascending: true
      });


  if (error) {

    console.error(
      "Load error:",
      error
    );

    return;
  }


  messages.innerHTML = "";

  data.forEach(addMessage);
}


form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const name =
      nameInput.value.trim();

    const message =
      messageInput.value.trim();


    if (!name || !message) return;


    const { error } =
      await supabaseClient
        .from("messages")
        .insert({

          name: name,

          message: message,

          sender_type: "visitor",

          message_type: "text"

        });


    if (error) {

      console.error(
        "Send error:",
        error
      );

      alert(
        "Message was not sent."
      );

      return;
    }


    messageInput.value = "";

    messageInput.focus();
  }
);


voiceButton.addEventListener(
  "click",
  async () => {

    if (!isRecording) {

      try {

        const stream =
          await navigator.mediaDevices
            .getUserMedia({
              audio: true
            });


        mediaRecorder =
          new MediaRecorder(stream);


        audioChunks = [];


        mediaRecorder.ondataavailable =
          (event) => {

            if (event.data.size > 0) {

              audioChunks.push(
                event.data
              );
            }
          };


        mediaRecorder.onstop =
          async () => {

            stream
              .getTracks()
              .forEach(
                track =>
                  track.stop()
              );


            const audioBlob =
              new Blob(
                audioChunks,
                {
                  type:
                    "audio/webm"
                }
              );


            const fileName =
              `voice-${Date.now()}.webm`;


            const filePath =
              `messages/${fileName}`;


            const { error: uploadError } =
              await supabaseClient
                .storage
                .from("voice-messages")
                .upload(
                  filePath,
                  audioBlob,
                  {
                    contentType:
                      "audio/webm"
                  }
                );


            if (uploadError) {

              console.error(
                "Upload error:",
                uploadError
              );

              alert(
                "Voice upload failed."
              );

              return;
            }


            const { data } =
              supabaseClient
                .storage
                .from("voice-messages")
                .getPublicUrl(
                  filePath
                );


           
