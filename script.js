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


// ===============================
// SHOW MESSAGE
// ===============================

function addMessage(item) {

  const message = document.createElement("div");

  message.className =
    item.sender_type === "admin"
      ? "message visitor"
      : "message owner";


  // VOICE MESSAGE
  if (
    item.message_type === "voice" &&
    item.voice_url
  ) {

    const audio = document.createElement("audio");

    audio.controls = true;
    audio.src = item.voice_url;

    message.appendChild(audio);

  }

  // TEXT MESSAGE
  else {

    const bubble = document.createElement("div");

    bubble.className = "bubble";

    bubble.textContent =
      item.message;

    message.appendChild(bubble);
  }


  const time = document.createElement("span");

  time.textContent =
    item.name;

  message.appendChild(time);

  messages.appendChild(message);

  messages.scrollTop =
    messages.scrollHeight;
}


// ===============================
// LOAD OLD MESSAGES
// ===============================

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

  data.forEach(
    addMessage
  );
}


// ===============================
// SEND TEXT MESSAGE
// ===============================

form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const name =
      nameInput.value.trim();

    const message =
      messageInput.value.trim();


    if (!name || !message) {

      return;
    }


    const { error } =
      await supabaseClient
        .from("messages")
        .insert({

          name: name,

          message: message,

          sender_type:
            "visitor",

          message_type:
            "text"

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


// ===============================
// VOICE RECORDING
// ===============================

voiceButton.addEventListener(
  "click",
  async () => {


    // ===========================
    // START RECORDING
    // ===========================

    if (!isRecording) {


      const name =
        nameInput.value.trim();


      if (!name) {

        alert(
          "Enter your name first."
        );

        nameInput.focus();

        return;
      }


      try {

        // Ask microphone permission

        const stream =
          await navigator.mediaDevices
            .getUserMedia({
              audio: true
            });


        // Create recorder

        mediaRecorder =
          new MediaRecorder(stream);


        audioChunks = [];


        // Receive audio data

        mediaRecorder.ondataavailable =
          (event) => {

            if (
              event.data &&
              event.data.size > 0
            ) {

              audioChunks.push(
                event.data
              );
            }
          };


        // ========================
        // WHEN RECORDING STOPS
        // ========================

        mediaRecorder.onstop =
          async () => {


            // Stop microphone

            stream
              .getTracks()
              .forEach(
                (track) => {
                  track.stop();
                }
              );


            // Create audio file

            const audioBlob =
              new Blob(
                audioChunks,
                {
                  type:
                    "audio/webm"
                }
              );


            // File name

            const fileName =
              `voice-${Date.now()}.webm`;


            // File path in Storage

            const filePath =
              `messages/${fileName}`;


            // ======================
            // UPLOAD VOICE
            // ======================

            const {
              error: uploadError
            } =
              await supabaseClient
                .storage
                .from(
                  "voice-messages"
                )
                .upload(
                  filePath,
                  audioBlob,
                  {
                    contentType:
                      "audio/webm",

                    upsert:
                      false
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

              voiceButton.textContent =
                "🎤 Record voice";

              return;
            }


            // ======================
            // GET PUBLIC URL
            // ======================

            const {
              data
            } =
              supabaseClient
                .storage
                .from(
                  "voice-messages"
                )
                .getPublicUrl(
                  filePath
                );


            const voiceUrl =
              data.publicUrl;


            // ======================
            // SAVE MESSAGE
            // ======================

            const {
              error
            } =
              await supabaseClient
                .from("messages")
                .insert({

                  name:
                    name,

                  message:
                    "🎤 Voice message",

                  sender_type:
                    "visitor",

                  message_type:
                    "voice",

                  voice_url:
                    voiceUrl

                });


            if (error) {

              console.error(
                "Database error:",
                error
              );

              alert(
                "Voice message was not saved."
              );

              voiceButton.textContent =
                "🎤 Record voice";

              return;
            }


            // Done

            voiceButton.textContent =
              "🎤 Record voice";
          };


        // Start recording

        mediaRecorder.start();

        isRecording = true;


        voiceButton.textContent =
          "⏹️ Stop recording";


      }

      catch (error) {

        console.error(
          "Microphone error:",
          error
        );

        alert(
          "Microphone permission is required."
        );

      }

    }


    // ===========================
    // STOP RECORDING
    // ===========================

    else {

      if (mediaRecorder) {

        mediaRecorder.stop();

      }

      isRecording = false;

      voiceButton.textContent =
        "⏳ Uploading voice...";
    }

  }
);


// ===============================
// REALTIME
// ===============================

supabaseClient
  .channel(
    "messages-realtime"
  )

  .on(
    "postgres_changes",
    {
      event:
        "INSERT",

      schema:
        "public",

      table:
        "messages"
    },

    (payload) => {

      console.log(
        "NEW MESSAGE:",
        payload.new
      );

      addMessage(
        payload.new
      );
    }
  )

  .subscribe(
    (status) => {

      console.log(
        "Realtime status:",
        status
      );

    }
  );


// ===============================
// START
// ===============================

loadMessages();
