const SUPABASE_URL =
  "https://wcdekipnhcmskmieyaij.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_7SyUtBHnQDXvsvKywxIzFg_VelpqtPN";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ==================================================
// ELEMENTS
// ==================================================

const form =
  document.getElementById("chatForm");

const messages =
  document.getElementById("messages");

const nameInput =
  document.getElementById("nameInput");

const messageInput =
  document.getElementById("messageInput");

const voiceButton =
  document.getElementById("voiceButton");

const videoCallButton =
  document.getElementById("videoCallButton");


// ==================================================
// VOICE VARIABLES
// ==================================================

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;


// ==================================================
// VIDEO CALL VARIABLES
// ==================================================

const ROOM_ID =
  "englishflow-main-room";

let peerConnection = null;

let localStream = null;

let currentCallId = null;

let pendingIceCandidates = [];


// ==================================================
// CREATE VIDEO UI
// ==================================================

function createVideoUI() {

  if (document.getElementById("videoArea")) {
    return;
  }

  const area =
    document.createElement("div");

  area.id = "videoArea";

  area.style.display = "none";

  area.style.padding = "15px";

  area.style.borderTop =
    "1px solid #292932";

  area.style.background =
    "#090a0f";

  area.innerHTML = `

    <div
      style="
        display:flex;
        gap:10px;
        margin-bottom:10px;
        flex-wrap:wrap;
      "
    >

      <video
        id="remoteVideo"
        autoplay
        playsinline
        style="
          width:100%;
          max-width:480px;
          background:#000;
          border-radius:15px;
        "
      ></video>

      <video
        id="localVideo"
        autoplay
        muted
        playsinline
        style="
          width:150px;
          height:110px;
          object-fit:cover;
          background:#000;
          border-radius:12px;
        "
      ></video>

    </div>

    <div
      style="
        display:flex;
        gap:10px;
        align-items:center;
      "
    >

      <span id="callStatus">
        Video call
      </span>

      <button
        id="hangupButton"
        type="button"
        style="
          padding:10px 16px;
          border:0;
          border-radius:10px;
          background:#dc2626;
          color:white;
          font-weight:bold;
        "
      >
        🔴 End call
      </button>

    </div>
  `;

  const card =
    document.querySelector(".chat-card");

  card.appendChild(area);


  document
    .getElementById("hangupButton")
    .addEventListener(
      "click",
      hangUpCall
    );
}


// ==================================================
// INCOMING CALL UI
// ==================================================

function showIncomingCall() {

  if (
    document.getElementById(
      "incomingCall"
    )
  ) {
    return;
  }

  const box =
    document.createElement("div");

  box.id =
    "incomingCall";

  box.style.position =
    "fixed";

  box.style.left =
    "15px";

  box.style.right =
    "15px";

  box.style.bottom =
    "20px";

  box.style.zIndex =
    "9999";

  box.style.padding =
    "20px";

  box.style.borderRadius =
    "18px";

  box.style.background =
    "#17181f";

  box.style.border =
    "1px solid #7c3aed";

  box.style.boxShadow =
    "0 20px 60px #000";

  box.style.textAlign =
    "center";

  box.innerHTML = `

    <div
      style="
        font-size:22px;
        font-weight:bold;
        margin-bottom:8px;
      "
    >
      📹 Incoming video call
    </div>

    <div
      style="
        color:#aaa;
        margin-bottom:15px;
      "
    >
      Admin is calling you
    </div>

    <div
      style="
        display:flex;
        justify-content:center;
        gap:10px;
      "
    >

      <button
        id="acceptCallButton"
        type="button"
        style="
          padding:12px 20px;
          border:0;
          border-radius:10px;
          background:#16a34a;
          color:white;
          font-weight:bold;
        "
      >
        ✅ Accept
      </button>

      <button
        id="rejectCallButton"
        type="button"
        style="
          padding:12px 20px;
          border:0;
          border-radius:10px;
          background:#dc2626;
          color:white;
          font-weight:bold;
        "
      >
        ❌ Reject
      </button>

    </div>
  `;

  document.body.appendChild(box);


  document
    .getElementById("acceptCallButton")
    .addEventListener(
      "click",
      acceptIncomingCall
    );


  document
    .getElementById("rejectCallButton")
    .addEventListener(
      "click",
      rejectIncomingCall
    );
}


// ==================================================
// HIDE INCOMING CALL
// ==================================================

function hideIncomingCall() {

  const box =
    document.getElementById(
      "incomingCall"
    );

  if (box) {
    box.remove();
  }
}


// ==================================================
// SHOW VIDEO AREA
// ==================================================

function showVideoArea() {

  const area =
    document.getElementById(
      "videoArea"
    );

  if (area) {
    area.style.display = "block";
  }
}


// ==================================================
// HIDE VIDEO AREA
// ==================================================

function hideVideoArea() {

  const area =
    document.getElementById(
      "videoArea"
    );

  if (area) {
    area.style.display = "none";
  }
}


// ==================================================
// CALL STATUS
// ==================================================

function setCallStatus(text) {

  const status =
    document.getElementById(
      "callStatus"
    );

  if (status) {
    status.textContent = text;
  }
}


// ==================================================
// WEBRTC CONFIG
// ==================================================

const rtcConfig = {

  iceServers: [

    {
      urls:
        "stun:stun.l.google.com:19302"
    },

    {
      urls:
        "stun:stun1.l.google.com:19302"
    }

  ]

};


// ==================================================
// CREATE PEER CONNECTION
// ==================================================

function createPeerConnection(
  callId,
  remoteRole
) {

  if (peerConnection) {

    peerConnection.close();

  }


  peerConnection =
    new RTCPeerConnection(
      rtcConfig
    );


  peerConnection.onicecandidate =
    async (event) => {

      if (
        event.candidate
      ) {

        await sendSignal(
          callId,
          "ice",
          {
            candidate:
              event.candidate
          }
        );

      }

    };


  peerConnection.ontrack =
    (event) => {

      const remoteVideo =
        document.getElementById(
          "remoteVideo"
        );

      if (
        remoteVideo &&
        event.streams[0]
      ) {

        remoteVideo.srcObject =
          event.streams[0];

      }

    };


  peerConnection.onconnectionstatechange =
    () => {

      console.log(
        "Connection:",
        peerConnection.connectionState
      );


      if (
        peerConnection.connectionState ===
        "connected"
      ) {

        setCallStatus(
          "🟢 Connected"
        );

      }


      if (
        peerConnection.connectionState ===
        "disconnected"
      ) {

        setCallStatus(
          "🟠 Disconnected"
        );

      }


      if (
        peerConnection.connectionState ===
        "failed"
      ) {

        setCallStatus(
          "🔴 Connection failed"
        );

      }

    };


  return peerConnection;
}


// ==================================================
// GET CAMERA + MICROPHONE
// ==================================================

async function getLocalMedia() {

  if (localStream) {
    return localStream;
  }


  localStream =
    await navigator.mediaDevices
      .getUserMedia({

        video: true,

        audio: true

      });


  const localVideo =
    document.getElementById(
      "localVideo"
    );


  if (localVideo) {

    localVideo.srcObject =
      localStream;

  }


  return localStream;
}


// ==================================================
// SEND SIGNAL
// ==================================================

async function sendSignal(
  callId,
  type,
  data
) {

  const { error } =
    await supabaseClient
      .from("calls")
      .insert({

        room_id:
          ROOM_ID,

        sender:
          "visitor",

        type:
          type,

        data: {

          call_id:
            callId,

          ...data

        }

      });


  if (error) {

    console.error(
      "Signal error:",
      error
    );

  }

}


// ==================================================
// ADD ICE CANDIDATE SAFELY
// ==================================================

async function addIceCandidate(
  candidate
) {

  if (
    !peerConnection ||
    !candidate
  ) {
    return;
  }


  try {

    await peerConnection
      .addIceCandidate(
        new RTCIceCandidate(
          candidate
        )
      );

  }

  catch (error) {

    console.error(
      "ICE error:",
      error
    );

  }

}


// ==================================================
// ACCEPT INCOMING CALL
// ==================================================

async function acceptIncomingCall() {

  hideIncomingCall();

  showVideoArea();

  setCallStatus(
    "Connecting..."
  );


  try {

    await getLocalMedia();


    createPeerConnection(
      currentCallId,
      "admin"
    );


    const stream =
      localStream;


    stream
      .getTracks()
      .forEach(
        (track) => {

          peerConnection
            .addTrack(
              track,
              stream
            );

        }
      );


    const { error } =
      await supabaseClient
        .from("calls")
        .insert({

          room_id:
            ROOM_ID,

          sender:
            "visitor",

          type:
            "accepted",

          data: {

            call_id:
              currentCallId

          }

        });


    if (error) {

      console.error(
        error
      );

    }

  }

  catch (error) {

    console.error(
      "Camera/microphone error:",
      error
    );

    alert(
      "Camera and microphone permission is required."
    );

    hideVideoArea();

  }

}


// ==================================================
// REJECT CALL
// ==================================================

async function rejectIncomingCall() {

  hideIncomingCall();


  if (!currentCallId) {
    return;
  }


  await sendSignal(
    currentCallId,
    "rejected",
    {}
  );


  currentCallId =
    null;
}


// ==================================================
// HANG UP
// ==================================================

async function hangUpCall() {

  const callId =
    currentCallId;


  if (callId) {

    await sendSignal(
      callId,
      "hangup",
      {}
    );

  }


  closeVideoCall();
}


// ==================================================
// CLOSE VIDEO CALL
// ==================================================

function closeVideoCall() {

  if (peerConnection) {

    peerConnection.close();

    peerConnection =
      null;

  }


  if (localStream) {

    localStream
      .getTracks()
      .forEach(
        (track) => {
          track.stop();
        }
      );

    localStream =
      null;

  }


  const localVideo =
    document.getElementById(
      "localVideo"
    );

  const remoteVideo =
    document.getElementById(
      "remoteVideo"
    );


  if (localVideo) {

    localVideo.srcObject =
      null;

  }


  if (remoteVideo) {

    remoteVideo.srcObject =
      null;

  }


  hideVideoArea();

  hideIncomingCall();

  currentCallId =
    null;

  pendingIceCandidates =
    [];

}


// ==================================================
// HANDLE CALL SIGNALS
// ==================================================

async function handleCallSignal(
  signal
) {

  const data =
    signal.data || {};

  const callId =
    data.call_id;


  if (!callId) {
    return;
  }


  // -----------------------------------------------
  // NEW OFFER FROM ADMIN
  // -----------------------------------------------

  if (
    signal.type === "offer" &&
    signal.sender === "admin"
  ) {

    currentCallId =
      callId;


    showIncomingCall();

    return;
  }


  // -----------------------------------------------
  // ADMIN ACCEPTED
  // -----------------------------------------------

  if (
    signal.type === "accepted" &&
    signal.sender === "visitor"
  ) {

    return;
  }


  // -----------------------------------------------
  // ANSWER FROM ADMIN
  // -----------------------------------------------

  if (
    signal.type === "answer" &&
    signal.sender === "admin"
  ) {

    if (
      peerConnection
    ) {

      await peerConnection
        .setRemoteDescription(
          new RTCSessionDescription(
            data.answer
          )
        );


      for (
        const candidate
        of pendingIceCandidates
      ) {

        await addIceCandidate(
          candidate
        );

      }


      pendingIceCandidates =
        [];

    }

    return;
  }


  // -----------------------------------------------
  // ICE
  // -----------------------------------------------

  if (
    signal.type === "ice" &&
    signal.sender === "admin"
  ) {

    if (
      peerConnection &&
      peerConnection.remoteDescription
    ) {

      await addIceCandidate(
        data.candidate
      );

    }

    else {

      pendingIceCandidates.push(
        data.candidate
      );

    }

    return;
  }


  // -----------------------------------------------
  // HANGUP
  // -----------------------------------------------

  if (
    signal.type === "hangup"
  ) {

    closeVideoCall();

    return;
  }


  // -----------------------------------------------
  // REJECT
  // -----------------------------------------------

  if (
    signal.type === "rejected"
  ) {

    closeVideoCall();

    alert(
      "The call was rejected."
    );

  }

}


// ==================================================
// REALTIME CALL CHANNEL
// ==================================================

supabaseClient
  .channel(
    "englishflow-calls"
  )

  .on(

    "postgres_changes",

    {

      event:
        "INSERT",

      schema:
        "public",

      table:
        "calls"

    },

    async (payload) => {

      console.log(
        "CALL SIGNAL:",
        payload.new
      );


      await handleCallSignal(
        payload.new
      );

    }

  )

  .subscribe(
    (status) => {

      console.log(
        "Call realtime:",
        status
      );

    }
  );


// ==================================================
// VIDEO BUTTON
// ==================================================

if (videoCallButton) {

  videoCallButton.addEventListener(
    "click",
    () => {

      alert(
        "Please wait for the Admin to start the video call."
      );

    }
  );

}


// ==================================================
// CREATE VIDEO UI
// ==================================================

createVideoUI();


// ==================================================
// SHOW MESSAGE
// ==================================================

function addMessage(item) {

  const message =
    document.createElement(
      "div"
    );


  message.className =
    item.sender_type === "admin"
      ? "message visitor"
      : "message owner";


  if (
    item.message_type === "voice" &&
    item.voice_url
  ) {

    const audio =
      document.createElement(
        "audio"
      );


    audio.controls =
      true;


    audio.src =
      item.voice_url;


    message.appendChild(
      audio
    );

  }

  else {

    const bubble =
      document.createElement(
        "div"
      );


    bubble.className =
      "bubble";


    bubble.textContent =
      item.message;


    message.appendChild(
      bubble
    );

  }


  const time =
    document.createElement(
      "span"
    );


  time.textContent =
    item.name;


  message.appendChild(
    time
  );


  messages.appendChild(
    message
  );


  messages.scrollTop =
    messages.scrollHeight;
}


// ==================================================
// LOAD MESSAGES
// ==================================================

async function loadMessages() {

  const { data, error } =
    await supabaseClient
      .from("messages")
      .select("*")
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Load error:",
      error
    );

    return;
  }


  messages.innerHTML =
    "";


  data.forEach(
    addMessage
  );

}


// ==================================================
// SEND TEXT
// ==================================================

form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const name =
      nameInput.value.trim();


    const message =
      messageInput.value.trim();


    if (
      !name ||
      !message
    ) {

      return;

    }


    const { error } =
      await supabaseClient
        .from("messages")
        .insert({

          name:
            name,

          message:
            message,

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


    messageInput.value =
      "";

    messageInput.focus();

  }
);


// ==================================================
// VOICE RECORDING
// ==================================================

voiceButton.addEventListener(
  "click",
  async () => {

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

        const stream =
          await navigator.mediaDevices
            .getUserMedia({

              audio: true

            });


        mediaRecorder =
          new MediaRecorder(
            stream
          );


        audioChunks =
          [];


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


        mediaRecorder.onstop =
          async () => {

            stream
              .getTracks()
              .forEach(
                (track) => {
                  track.stop();
                }
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
                uploadError
              );

              alert(
                "Voice upload failed."
              );

              voiceButton.textContent =
                "🎤";

              return;

            }


            const { data } =
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
                error
              );

              alert(
                "Voice message was not saved."
              );

              voiceButton.textContent =
                "🎤";

              return;

            }


            voiceButton.textContent =
              "🎤";

          };


        mediaRecorder.start();

        isRecording =
          true;


        voiceButton.textContent =
          "⏹️";

      }

      catch (error) {

        console.error(
          error
        );

        alert(
          "Microphone permission is required."
        );

      }

    }

    else {

      if (mediaRecorder) {

        mediaRecorder.stop();

      }


      isRecording =
        false;


      voiceButton.textContent =
        "⏳";

    }

  }
);


// ==================================================
// START
// ==================================================

loadMessages();
