const SUPABASE_URL =
  "https://wcdekipnhcmskmieyaij.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_7SyUtBHnQDXvsvKywxIzFg_VelpqtPN";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ===============================
// CHAT ELEMENTS
// ===============================

const chatForm =
  document.getElementById("chatForm");

const messagesBox =
  document.getElementById("messages");

const nameInput =
  document.getElementById("nameInput");

const messageInput =
  document.getElementById("messageInput");


// ===============================
// VOICE
// ===============================

const voiceButton =
  document.getElementById("voiceButton");

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;


// ===============================
// VIDEO CALL
// ===============================

const videoCallButton =
  document.getElementById("videoCallButton");

const ROOM_ID =
  "englishflow-main-room";

let peerConnection = null;
let localStream = null;

let currentCallId = null;

let pendingOffer = null;

let pendingIceCandidates = [];

let remoteVideo = null;
let localVideo = null;
let videoArea = null;
let callStatus = null;
let incomingCallBox = null;


// ===============================
// WEBRTC CONFIG
// ===============================

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


// ===============================
// CREATE VIDEO UI
// ===============================

function createVideoUI() {

  if (
    document.getElementById(
      "videoCallArea"
    )
  ) {
    return;
  }


  videoArea =
    document.createElement("div");

  videoArea.id =
    "videoCallArea";

  videoArea.style.cssText = `
    display:none;
    position:fixed;
    inset:0;
    z-index:9999;
    background:#050507;
    padding:15px;
    flex-direction:column;
  `;


  const title =
    document.createElement("div");

  title.textContent =
    "📹 Video Call";

  title.style.cssText = `
    color:white;
    font-size:20px;
    font-weight:bold;
    margin-bottom:10px;
  `;


  callStatus =
    document.createElement("div");

  callStatus.textContent =
    "Ready";

  callStatus.style.cssText = `
    color:#aaa;
    margin-bottom:10px;
  `;


  const videos =
    document.createElement("div");

  videos.style.cssText = `
    position:relative;
    flex:1;
    min-height:0;
    display:flex;
    align-items:center;
    justify-content:center;
    background:#111;
    border-radius:16px;
    overflow:hidden;
  `;


  remoteVideo =
    document.createElement("video");

  remoteVideo.id =
    "remoteVideo";

  remoteVideo.autoplay = true;

  remoteVideo.playsInline = true;

  remoteVideo.style.cssText = `
    width:100%;
    height:100%;
    object-fit:contain;
    background:#111;
  `;


  localVideo =
    document.createElement("video");

  localVideo.id =
    "localVideo";

  localVideo.autoplay = true;

  localVideo.muted = true;

  localVideo.playsInline = true;

  localVideo.style.cssText = `
    position:absolute;
    right:12px;
    bottom:12px;
    width:120px;
    height:160px;
    object-fit:cover;
    background:#222;
    border:2px solid white;
    border-radius:12px;
    z-index:2;
  `;


  videos.appendChild(
    remoteVideo
  );

  videos.appendChild(
    localVideo
  );


  const buttons =
    document.createElement("div");

  buttons.style.cssText = `
    display:flex;
    gap:10px;
    margin-top:12px;
  `;


  const hangupButton =
    document.createElement("button");

  hangupButton.textContent =
    "📴 End Call";

  hangupButton.style.cssText = `
    flex:1;
    padding:14px;
    border:none;
    border-radius:12px;
    background:#dc2626;
    color:white;
    font-size:16px;
    font-weight:bold;
  `;


  hangupButton.onclick =
    () => {

      hangupCall();

    };


  buttons.appendChild(
    hangupButton
  );


  videoArea.appendChild(
    title
  );

  videoArea.appendChild(
    callStatus
  );

  videoArea.appendChild(
    videos
  );

  videoArea.appendChild(
    buttons
  );


  document.body.appendChild(
    videoArea
  );


  // ===============================
  // INCOMING CALL BOX
  // ===============================

  incomingCallBox =
    document.createElement("div");

  incomingCallBox.id =
    "incomingCallBox";

  incomingCallBox.style.cssText = `
    display:none;
    position:fixed;
    left:50%;
    top:50%;
    transform:translate(-50%,-50%);
    z-index:10000;
    width:min(90%,360px);
    background:#18181b;
    color:white;
    padding:24px;
    border-radius:20px;
    box-shadow:0 20px 70px #000;
    text-align:center;
  `;


  const incomingTitle =
    document.createElement("div");

  incomingTitle.textContent =
    "📹 Incoming video call";

  incomingTitle.style.cssText = `
    font-size:20px;
    font-weight:bold;
    margin-bottom:10px;
  `;


  const incomingText =
    document.createElement("div");

  incomingText.textContent =
    "Someone is calling you.";

  incomingText.style.cssText = `
    color:#aaa;
    margin-bottom:20px;
  `;


  const incomingButtons =
    document.createElement("div");

  incomingButtons.style.cssText = `
    display:flex;
    gap:10px;
  `;


  const acceptButton =
    document.createElement("button");

  acceptButton.textContent =
    "Accept";

  acceptButton.style.cssText = `
    flex:1;
    padding:13px;
    border:none;
    border-radius:12px;
    background:#16a34a;
    color:white;
    font-weight:bold;
  `;


  acceptButton.onclick =
    () => {

      acceptIncomingCall();

    };


  const rejectButton =
    document.createElement("button");

  rejectButton.textContent =
    "Reject";

  rejectButton.style.cssText = `
    flex:1;
    padding:13px;
    border:none;
    border-radius:12px;
    background:#dc2626;
    color:white;
    font-weight:bold;
  `;


  rejectButton.onclick =
    () => {

      rejectIncomingCall();

    };


  incomingButtons.appendChild(
    acceptButton
  );

  incomingButtons.appendChild(
    rejectButton
  );


  incomingCallBox.appendChild(
    incomingTitle
  );

  incomingCallBox.appendChild(
    incomingText
  );

  incomingCallBox.appendChild(
    incomingButtons
  );


  document.body.appendChild(
    incomingCallBox
  );

}


// Create UI immediately

createVideoUI();


// ===============================
// VIDEO UI FUNCTIONS
// ===============================

function showVideoArea() {

  if (!videoArea) {
    createVideoUI();
  }

  videoArea.style.display =
    "flex";

}


function hideVideoArea() {

  if (videoArea) {

    videoArea.style.display =
      "none";

  }

}


function setCallStatus(text) {

  if (callStatus) {

    callStatus.textContent =
      text;

  }

}


function showIncomingCall() {

  if (!incomingCallBox) {
    createVideoUI();
  }

  incomingCallBox.style.display =
    "block";

}


function hideIncomingCall() {

  if (incomingCallBox) {

    incomingCallBox.style.display =
      "none";

  }

}


// ===============================
// GET CAMERA + MICROPHONE
// ===============================

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


  if (localVideo) {

    localVideo.srcObject =
      localStream;

  }


  return localStream;

}


// ===============================
// CREATE PEER CONNECTION
// ===============================

function createPeerConnection(
  callId
) {

  if (peerConnection) {

    try {

      peerConnection.close();

    } catch (e) {}

  }


  peerConnection =
    new RTCPeerConnection(
      rtcConfig
    );


  peerConnection.onicecandidate =
    async (event) => {

      if (
        event.candidate &&
        callId
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

      console.log(
        "Remote video track received"
      );


      if (
        remoteVideo &&
        event.streams &&
        event.streams[0]
      ) {

        remoteVideo.srcObject =
          event.streams[0];

      }

    };


  peerConnection.onconnectionstatechange =
    () => {

      console.log(
        "Connection state:",
        peerConnection.connectionState
      );


      if (
        peerConnection.connectionState ===
        "connected"
      ) {

        setCallStatus(
          "Connected"
        );

      }


      if (
        peerConnection.connectionState ===
        "connecting"
      ) {

        setCallStatus(
          "Connecting..."
        );

      }


      if (
        peerConnection.connectionState ===
        "disconnected" ||
        peerConnection.connectionState ===
        "failed"
      ) {

        setCallStatus(
          "Connection lost"
        );

      }

    };


  peerConnection.oniceconnectionstatechange =
    () => {

      console.log(
        "ICE state:",
        peerConnection.iceConnectionState
      );

    };


  return peerConnection;

}


// ===============================
// SEND SIGNAL TO SUPABASE
// ===============================

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


// ===============================
// ADD ICE CANDIDATE
// ===============================

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
      "ICE candidate error:",
      error
    );

  }

}


// ===============================
// ACCEPT INCOMING CALL
// ===============================

async function acceptIncomingCall() {

  hideIncomingCall();

  showVideoArea();

  setCallStatus(
    "Connecting..."
  );


  try {

    if (!pendingOffer) {

      throw new Error(
        "No video call offer found."
      );

    }


    await getLocalMedia();


    createPeerConnection(
      currentCallId
    );


    const stream =
      localStream;


    stream
      .getTracks()
      .forEach(

        (track) => {

          peerConnection.addTrack(

            track,

            stream

          );

        }

      );


    await peerConnection
      .setRemoteDescription(

        new RTCSessionDescription(
          pendingOffer
        )

      );


    // Add ICE candidates
    // that arrived before Accept

    for (
      const candidate of
      pendingIceCandidates
    ) {

      await addIceCandidate(
        candidate
      );

    }


    pendingIceCandidates = [];


    // Create answer

    const answer =
      await peerConnection
        .createAnswer();


    await peerConnection
      .setLocalDescription(
        answer
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
            "answer",

          data: {

            call_id:
              currentCallId,

            answer:
              answer

          }

        });


    if (error) {

      throw error;

    }


    pendingOffer =
      null;


    setCallStatus(
      "Waiting for connection..."
    );


  }

  catch (error) {

    console.error(
      "Accept call error:",
      error
    );


    alert(
      "Could not start the video call."
    );


    closeVideoCall();

  }

}


// ===============================
// REJECT CALL
// ===============================

async function rejectIncomingCall() {

  hideIncomingCall();


  if (currentCallId) {

    await sendSignal(

      currentCallId,

      "rejected",

      {}

    );

  }


  pendingOffer =
    null;

  pendingIceCandidates =
    [];

  currentCallId =
    null;

}


// ===============================
// HANG UP
// ===============================

async function hangupCall() {

  if (currentCallId) {

    await sendSignal(

      currentCallId,

      "hangup",

      {}

    );

  }


  closeVideoCall();

}


// ===============================
// CLOSE VIDEO CALL
// ===============================

function closeVideoCall() {

  if (peerConnection) {

    try {

      peerConnection.close();

    }

    catch (e) {}

  }


  peerConnection =
    null;


  if (localStream) {

    localStream
      .getTracks()
      .forEach(

        (track) => {

          track.stop();

        }

      );

  }


  localStream =
    null;


  if (localVideo) {

    localVideo.srcObject =
      null;

  }


  if (remoteVideo) {

    remoteVideo.srcObject =
      null;

  }


  currentCallId =
    null;


  pendingOffer =
    null;


  pendingIceCandidates =
    [];


  hideIncomingCall();

  hideVideoArea();

}


// ===============================
// HANDLE VIDEO SIGNALS
// ===============================

async function handleCallSignal(
  payload
) {

  const signal =
    payload.new;


  if (!signal) {

    return;

  }


  // Only signals from Admin
  // are relevant on visitor side

  if (
    signal.sender !==
    "admin"
  ) {

    return;

  }


  const data =
    signal.data || {};


  const callId =
    data.call_id;


  if (!callId) {

    return;

  }


  // ===============================
  // OFFER
  // ===============================

  if (
    signal.type ===
      "offer"
  ) {

    console.log(
      "Incoming video offer"
    );


    currentCallId =
      callId;


    pendingOffer =
      data.offer;


    pendingIceCandidates =
      [];


    showIncomingCall();


    return;

  }


  // ===============================
  // ICE
  // ===============================

  if (
    signal.type ===
      "ice"
  ) {

    const candidate =
      data.candidate;


    if (!candidate) {

      return;

    }


    if (
      peerConnection &&
      peerConnection.remoteDescription
    ) {

      await addIceCandidate(
        candidate
      );

    }

    else {

      pendingIceCandidates.push(
        candidate
      );

    }


    return;

  }


  // ===============================
  // HANGUP
  // ===============================

  if (
    signal.type ===
      "hangup"
  ) {

    alert(
      "The video call has ended."
    );


    closeVideoCall();


    return;

  }


  // ===============================
  // REJECTED
  // ===============================

  if (
    signal.type ===
      "rejected"
  ) {

    closeVideoCall();


    alert(
      "The video call was rejected."
    );


    return;

  }

}


// ===============================
// SUPABASE CALL REALTIME
// ===============================

supabaseClient
  .channel(
    "calls-realtime"
  )
  .on(

    "postgres_changes",

    {
      event:
        "INSERT",

      schema:
        "public",

      table:
        "calls",

      filter:
        `room_id=eq.${ROOM_ID}`

    },

    handleCallSignal

  )
  .subscribe(

    (status) => {

      console.log(
        "Calls realtime:",
        status
      );

    }

  );


// ===============================
// VIDEO BUTTON
// ===============================

if (videoCallButton) {

  videoCallButton.addEventListener(

    "click",

    () => {

      alert(
        "Waiting for a video call..."
      );

    }

  );

}


// ===============================
// ADD CHAT MESSAGE
// ===============================

function addMessage(
  item
) {

  if (!messagesBox) {

    return;

  }


  // Prevent duplicates

  if (item.id) {

    const existing =
      document.querySelector(
        `[data-message-id="${item.id}"]`
      );


    if (existing) {

      return;

    }

  }


  const message =
    document.createElement("div");


  message.className =
    "message";


  if (
    item.sender_type ===
    "admin"
  ) {

    message.classList.add(
      "owner"
    );

  }

  else {

    message.classList.add(
      "visitor"
    );

  }


  if (item.id) {

    message.dataset.messageId =
      item.id;

  }


  const bubble =
    document.createElement("div");


  bubble.className =
    "bubble";


  // ===============================
  // VOICE MESSAGE
  // ===============================

  if (
    item.message_type ===
      "voice" &&
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


    audio.style.width =
      "240px";


    bubble.appendChild(
      audio
    );

  }

  else {

    bubble.textContent =
      item.message || "";

  }


  const time =
    document.createElement(
      "span"
    );


  const date =
    item.created_at
      ? new Date(
          item.created_at
        )
      : new Date();


  time.textContent =
    date.toLocaleTimeString(
      [],
      {
        hour:
          "2-digit",

        minute:
          "2-digit"
      }
    );


  message.appendChild(
    bubble
  );


  message.appendChild(
    time
  );


  messagesBox.appendChild(
    message
  );


  messagesBox.scrollTop =
    messagesBox.scrollHeight;

}


// ===============================
// LOAD CHAT MESSAGES
// ===============================

async function loadMessages() {

  const { data, error } =
    await supabaseClient
      .from("messages")
      .select("*")
      .order(
        "created_at",
        {
          ascending:
            true
        }
      );


  if (error) {

    console.error(
      "Load messages error:",
      error
    );

    return;

  }


  if (messagesBox) {

    messagesBox.innerHTML =
      "";

  }


  data.forEach(
    addMessage
  );

}


// ===============================
// SEND TEXT MESSAGE
// ===============================

if (chatForm) {

  chatForm.addEventListener(

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
          "Send message error:",
          error
        );


        alert(
          "Could not send message."
        );


        return;

      }


      messageInput.value =
        "";

    }

  );

}


// ===============================
// VOICE RECORDING
// ===============================

if (voiceButton) {

  voiceButton.addEventListener(

    "click",

    async () => {

      if (isRecording) {

        if (mediaRecorder) {

          mediaRecorder.stop();

        }

        return;

      }


      try {

        const stream =
          await navigator.mediaDevices
            .getUserMedia({

              audio:
                true

            });


        audioChunks =
          [];


        mediaRecorder =
          new MediaRecorder(
            stream
          );


        mediaRecorder.ondataavailable =
          (event) => {

            if (
              event.data.size >
              0
            ) {

              audioChunks.push(
                event.data
              );

            }

          };


        mediaRecorder.onstop =
          async () => {

            isRecording =
              false;


            voiceButton.textContent =
              "🎤";


            stream
              .getTracks()
              .forEach(
                (track) =>
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


            await uploadVoice(
              audioBlob
            );

          };


        mediaRecorder.start();


        isRecording =
          true;


        voiceButton.textContent =
          "⏹️";


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

  );

}


// ===============================
// UPLOAD VOICE
// ===============================

async function uploadVoice(
  audioBlob
) {

  const fileName =
    `voice-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.webm`;


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
      "Voice upload error:",
      uploadError
    );


    alert(
      "Could not upload voice message."
    );


    return;

  }


  const {
    data: publicData
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
    publicData.publicUrl;


  const name =
    nameInput.value.trim();


  if (!name) {

    alert(
      "Enter your name first."
    );


    return;

  }


  const { error } =
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
      "Voice message error:",
      error
    );


    alert(
      "Could not save voice message."
    );


    return;

  }

}


// ===============================
// CHAT REALTIME
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
        "Messages realtime:",
        status
      );

    }

  );


// ===============================
// LOAD EVERYTHING
// ===============================

loadMessages();
