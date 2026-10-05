// ==================================================
// SUPABASE
// ==================================================

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
// CHAT ELEMENTS
// ==================================================

const chatForm =
  document.getElementById("chatForm");

const messagesBox =
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
// VOICE
// ==================================================

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;


// ==================================================
// VIDEO CALL
// ==================================================

const ROOM_ID =
  "englishflow-main-room";


// Every phone gets its own ID

let PEER_ID =
  localStorage.getItem(
    "englishflow-peer-id"
  );

if (!PEER_ID) {

  PEER_ID =
    crypto.randomUUID();

  localStorage.setItem(
    "englishflow-peer-id",
    PEER_ID
  );

}


// ==================================================
// WEBRTC
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


let peerConnection = null;

let localStream = null;

let currentCallId = null;

let pendingOffer = null;

let pendingIceCandidates = [];

let videoArea = null;

let remoteVideo = null;

let localVideo = null;

let callStatus = null;

let incomingCallBox = null;


// ==================================================
// CREATE VIDEO UI
// ==================================================

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
    margin-bottom:8px;
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
    background:#111;
    border-radius:16px;
    overflow:hidden;
  `;


  remoteVideo =
    document.createElement("video");

  remoteVideo.id =
    "remoteVideo";

  remoteVideo.autoplay =
    true;

  remoteVideo.playsInline =
    true;

  remoteVideo.style.cssText = `
    width:100%;
    height:100%;
    object-fit:cover;
    background:#111;
  `;


  localVideo =
    document.createElement("video");

  localVideo.id =
    "localVideo";

  localVideo.autoplay =
    true;

  localVideo.muted =
    true;

  localVideo.playsInline =
    true;

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
    hangupCall;


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


  // ==================================================
  // INCOMING CALL WINDOW
  // ==================================================

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
    acceptIncomingCall;


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
    rejectIncomingCall;


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


createVideoUI();


// ==================================================
// VIDEO UI FUNCTIONS
// ==================================================

function showVideoArea() {

  videoArea.style.display =
    "flex";

}


function hideVideoArea() {

  videoArea.style.display =
    "none";

}


function setCallStatus(
  text
) {

  callStatus.textContent =
    text;

}


function showIncomingCall() {

  incomingCallBox.style.display =
    "block";

}


function hideIncomingCall() {

  incomingCallBox.style.display =
    "none";

}


// ==================================================
// CAMERA + MICROPHONE
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


  localVideo.srcObject =
    localStream;


  return localStream;

}


// ==================================================
// CREATE PEER CONNECTION
// ==================================================

function createPeerConnection() {

  if (peerConnection) {

    try {

      peerConnection.close();

    }

    catch (error) {}

  }


  peerConnection =
    new RTCPeerConnection(
      rtcConfig
    );


  // ==================================================
  // SEND ICE
  // ==================================================

  peerConnection.onicecandidate =
    async (event) => {

      if (
        event.candidate &&
        currentCallId
      ) {

        await sendSignal(

          "ice",

          {

            call_id:
              currentCallId,

            candidate:
              event.candidate

          }

        );

      }

    };


  // ==================================================
  // RECEIVE REMOTE VIDEO
  // ==================================================

  peerConnection.ontrack =
    async (event) => {

      console.log(
        "REMOTE TRACK RECEIVED"
      );


      if (
        event.streams &&
        event.streams[0]
      ) {

        remoteVideo.srcObject =
          event.streams[0];


        try {

          await remoteVideo.play();

        }

        catch (error) {

          console.log(
            "Remote video play:",
            error
          );

        }

      }

    };


  // ==================================================
  // CONNECTION STATE
  // ==================================================

  peerConnection.onconnectionstatechange =
    () => {

      if (!peerConnection) {

        return;

      }


      console.log(
        "WebRTC:",
        peerConnection.connectionState
      );


      if (
        peerConnection.connectionState ===
        "connecting"
      ) {

        setCallStatus(
          "🟡 Connecting..."
        );

      }


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
// SEND SIGNAL TO SUPABASE
// ==================================================

async function sendSignal(
  type,
  data
) {

  const signalData = {

    peer_id:
      PEER_ID,

    ...data

  };


  const { error } =
    await supabaseClient
      .from("calls")
      .insert({

        room_id:
          ROOM_ID,

        sender:
          "peer",

        type:
          type,

        data:
          signalData

      });


  if (error) {

    console.error(
      "SIGNAL ERROR:",
      error
    );

  }

}


// ==================================================
// START VIDEO CALL
// ==================================================

async function startVideoCall() {

  if (currentCallId) {

    alert(
      "A video call is already active."
    );

    return;

  }


  try {

    setCallStatus(
      "Requesting camera..."
    );


    await getLocalMedia();


    showVideoArea();


    currentCallId =
      crypto.randomUUID();


    pendingIceCandidates =
      [];


    createPeerConnection();


    // Add camera + microphone

    localStream
      .getTracks()
      .forEach(
        (track) => {

          peerConnection.addTrack(

            track,

            localStream

          );

        }

      );


    // Create offer

    const offer =
      await peerConnection
        .createOffer();


    await peerConnection
      .setLocalDescription(
        offer
      );


    setCallStatus(
      "📞 Calling..."
    );


    await sendSignal(

      "offer",

      {

        call_id:
          currentCallId,

        offer:
          offer

      }

    );

  }

  catch (error) {

    console.error(
      "START CALL ERROR:",
      error
    );


    alert(
      "Camera and microphone permission is required."
    );


    closeVideoCall();

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

    if (!pendingOffer) {

      throw new Error(
        "No offer found."
      );

    }


    await getLocalMedia();


    createPeerConnection();


    // Add local camera + microphone

    localStream
      .getTracks()
      .forEach(
        (track) => {

          peerConnection.addTrack(

            track,

            localStream

          );

        }

      );


    // Set caller offer

    await peerConnection
      .setRemoteDescription(

        new RTCSessionDescription(
          pendingOffer
        )

      );


    // Add ICE received before Accept

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


    // Create answer

    const answer =
      await peerConnection
        .createAnswer();


    await peerConnection
      .setLocalDescription(
        answer
      );


    // Send answer

    await sendSignal(

      "answer",

      {

        call_id:
          currentCallId,

        answer:
          answer

      }

    );


    pendingOffer =
      null;


    setCallStatus(
      "🟡 Waiting for connection..."
    );

  }

  catch (error) {

    console.error(
      "ACCEPT ERROR:",
      error
    );


    alert(
      "Could not connect the video call."
    );


    closeVideoCall();

  }

}


// ==================================================
// ADD ICE CANDIDATE
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
      "ICE ERROR:",
      error
    );

  }

}


// ==================================================
// REJECT CALL
// ==================================================

async function rejectIncomingCall() {

  if (currentCallId) {

    await sendSignal(

      "rejected",

      {

        call_id:
          currentCallId

      }

    );

  }


  hideIncomingCall();


  currentCallId =
    null;


  pendingOffer =
    null;


  pendingIceCandidates =
    [];

}


// ==================================================
// HANG UP
// ==================================================

async function hangupCall() {

  if (currentCallId) {

    await sendSignal(

      "hangup",

      {

        call_id:
          currentCallId

      }

    );

  }


  closeVideoCall();

}


// ==================================================
// CLOSE VIDEO CALL
// ==================================================

function closeVideoCall() {

  if (peerConnection) {

    try {

      peerConnection.close();

    }

    catch (error) {}

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


  localVideo.srcObject =
    null;

  remoteVideo.srcObject =
    null;


  currentCallId =
    null;


  pendingOffer =
    null;


  pendingIceCandidates =
    [];


  hideIncomingCall();

  hideVideoArea();


  setCallStatus(
    "Ready"
  );

}


// ==================================================
// HANDLE INCOMING SIGNAL
// ==================================================

async function handleCallSignal(
  payload
) {

  const signal =
    payload.new;


  if (!signal) {

    return;

  }


  const data =
    signal.data || {};


  // Ignore our own signals

  if (
    data.peer_id ===
    PEER_ID
  ) {

    return;

  }


  const callId =
    data.call_id;


  if (!callId) {

    return;

  }


  // ==================================================
  // INCOMING OFFER
  // ==================================================

  if (
    signal.type ===
    "offer"
  ) {

    // If already in another call,
    // ignore this call

    if (currentCallId) {

      return;

    }


    console.log(
      "INCOMING OFFER"
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


  // ==================================================
  // ANSWER
  // ==================================================

  if (
    signal.type ===
    "answer"
  ) {

    if (
      callId !==
      currentCallId
    ) {

      return;

    }


    if (!peerConnection) {

      return;

    }


    console.log(
      "ANSWER RECEIVED"
    );


    await peerConnection
      .setRemoteDescription(

        new RTCSessionDescription(
          data.answer
        )

      );


    // Add ICE that arrived
    // before the answer

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


    setCallStatus(
      "🟡 Connecting..."
    );


    return;

  }


  // ==================================================
  // ICE
  // ==================================================

  if (
    signal.type ===
    "ice"
  ) {

    if (
      callId !==
      currentCallId
    ) {

      return;

    }


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


  // ==================================================
  // REJECTED
  // ==================================================

  if (
    signal.type ===
    "rejected"
  ) {

    if (
      callId !==
      currentCallId
    ) {

      return;

    }


    alert(
      "The video call was rejected."
    );


    closeVideoCall();


    return;

  }


  // ==================================================
  // HANGUP
  // ==================================================

  if (
    signal.type ===
    "hangup"
  ) {

    if (
      callId !==
      currentCallId
    ) {

      return;

    }


    closeVideoCall();


    return;

  }

}


// ==================================================
// REALTIME CALLS
// ==================================================

supabaseClient
  .channel(
    "video-calls-" +
    PEER_ID
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

    handleCallSignal

  )

  .subscribe(

    (status) => {

      console.log(
        "VIDEO REALTIME:",
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

    startVideoCall

  );

}


// ==================================================
// CHAT MESSAGE
// ==================================================

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
    document.createElement(
      "div"
    );


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
    document.createElement(
      "div"
    );


  bubble.className =
    "bubble";


  // Voice

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

          ascending:
            true

        }

      );


  if (error) {

    console.error(
      "LOAD MESSAGES ERROR:",
      error
    );

    return;

  }


  messagesBox.innerHTML =
    "";


  data.forEach(
    addMessage
  );


  messagesBox.scrollTop =
    messagesBox.scrollHeight;

}


// ==================================================
// SEND TEXT
// ==================================================

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
          "SEND MESSAGE ERROR:",
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


// ==================================================
// VOICE RECORDING
// ==================================================

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
          "VOICE ERROR:",
          error
        );


        alert(
          "Microphone permission is required."
        );

      }

    }

  );

}


// ==================================================
// UPLOAD VOICE
// ==================================================

async function uploadVoice(
  audioBlob
) {

  const name =
    nameInput.value.trim();


  if (!name) {

    alert(
      "Enter your name first."
    );

    return;

  }


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
      "VOICE UPLOAD ERROR:",
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
      "SAVE VOICE ERROR:",
      error
    );


    alert(
      "Could not save voice message."
    );

  }

}


// ==================================================
// CHAT REALTIME
// ==================================================

supabaseClient
  .channel(
    "messages-" +
    PEER_ID
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
        "MESSAGES REALTIME:",
        status
      );

    }

  );


// ==================================================
// START
// ==================================================

loadMessages();
