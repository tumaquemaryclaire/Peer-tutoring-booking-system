
import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

import { db } from "../services/firebase";
import "./VideoCall.css";


const ICE_SERVERS = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

const MAX_PDF_SIZE = 8 * 1024 * 1024;
const CHUNK_SIZE = 16 * 1024;

function VideoCall({ booking, currentUser, onClose }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const presentationChannelRef = useRef(null);
  const incomingFileRef = useRef(null);
  const pdfUrlRef = useRef(null);
  const fileInputRef = useRef(null);

  const isCallerRef = useRef(false);
  const answeringRef = useRef(false);
  const startingRef = useRef(false);
  const endingRef = useRef(false);

  const callIdRef = useRef(null);
  const activeCallIdRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const [callStatus, setCallStatus] = useState("Waiting for call...");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  // PRESENTATION STATES
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const bookingId = booking.id;
  const isTutor = currentUser.uid === booking.tutorUid;

  const sessionRef = doc(
    db,
    "bookings",
    bookingId,
    "videoCall",
    "current"
  );

  const messagesRef = collection(
    db,
    "bookings",
    bookingId,
    "messages"
  );

  const getOtherParticipantUid = () => {
    return currentUser.uid === booking.studentUid
      ? booking.tutorUid
      : booking.studentUid;
  };

  // ADD CALL EVENTS TO EXISTING CHAT
  const addCallMessage = async (message) => {
    try {
      await addDoc(messagesRef, {
        senderUid: currentUser.uid,
        text: message,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Call message error:", err);
    }
  };

  // GET CAMERA AND MICROPHONE
  const getLocalMedia = async () => {
    if (localStreamRef.current) {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      return localStreamRef.current;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Camera and microphone are unavailable. Please use localhost or HTTPS."
      );
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    return stream;
  };

  // =====================================
  // PRESENTATION FUNCTIONS
  // =====================================

  // RECEIVE PRESENTATION DATA
  const handlePresentationMessage = (event) => {
    if (typeof event.data === "string") {
      let message;

      try {
        message = JSON.parse(event.data);
      } catch (err) {
        console.error("Invalid presentation message:", err);
        return;
      }

      if (message.type === "file-start") {
        incomingFileRef.current = {
          name: message.name,
          size: message.size,
          totalPages: message.totalPages,
          chunks: [],
        };
      }

      if (message.type === "file-end") {
        const incoming = incomingFileRef.current;

        if (!incoming) return;

        const blob = new Blob(incoming.chunks, {
          type: "application/pdf",
        });

        if (pdfUrlRef.current) {
          URL.revokeObjectURL(pdfUrlRef.current);
        }

        const newUrl = URL.createObjectURL(blob);

        pdfUrlRef.current = newUrl;

        setPdfUrl(newUrl);
        setPdfName(incoming.name);
        setCurrentPage(1);
        setTotalPages(incoming.totalPages || 1);

        incomingFileRef.current = null;
      }

      if (message.type === "page-change") {
        setCurrentPage(message.page);
        setTotalPages(message.totalPages);
      }

      if (message.type === "presentation-close") {
        if (pdfUrlRef.current) {
          URL.revokeObjectURL(pdfUrlRef.current);
          pdfUrlRef.current = null;
        }

        setPdfUrl("");
        setPdfName("");
        setCurrentPage(1);
        setTotalPages(1);
      }

      return;
    }

    // RECEIVE PDF BINARY CHUNKS
    if (event.data instanceof ArrayBuffer) {
      if (incomingFileRef.current) {
        incomingFileRef.current.chunks.push(event.data);
      }
    }
  };

  // SET UP WEBRTC PRESENTATION CHANNEL
  const setupPresentationChannel = (channel) => {
    presentationChannelRef.current = channel;
    channel.binaryType = "arraybuffer";

    channel.onmessage = handlePresentationMessage;

    channel.onopen = () => {
      console.log("Presentation channel connected.");
    };

    channel.onclose = () => {
      console.log("Presentation channel closed.");
    };

    channel.onerror = (event) => {
      console.error("Presentation channel error:", event);
    };
  };

  // SEND PRESENTATION MESSAGE
  const sendPresentationMessage = (message) => {
    const channel = presentationChannelRef.current;

    if (!channel || channel.readyState !== "open") {
      throw new Error(
        "Presentation connection is not ready. Please wait until both participants are connected."
      );
    }

    channel.send(JSON.stringify(message));
  };

  // UPLOAD PDF LESSON
  const handlePdfUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    event.target.value = "";

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please upload a PDF file.");
      return;
    }

    if (file.size > MAX_PDF_SIZE) {
      setError("The PDF must not exceed 8 MB.");
      return;
    }

    try {
      setError("");
      setIsUploading(true);
      setUploadProgress(0);

      const channel = presentationChannelRef.current;

      if (!channel || channel.readyState !== "open") {
        throw new Error(
          "Please wait until the other participant is connected before sharing your lesson."
        );
      }

      const buffer = await file.arrayBuffer();

      // DETECT PDF PAGE COUNT
      const pdfDocument = await pdfjsLib
        .getDocument({
          data: buffer.slice(0),
        })
        .promise;

      const pageCount = pdfDocument.numPages;

      const totalChunks = Math.ceil(
        buffer.byteLength / CHUNK_SIZE
      );

      // SEND FILE INFORMATION FIRST
      sendPresentationMessage({
        type: "file-start",
        name: file.name,
        size: file.size,
        totalPages: pageCount,
      });

      // SEND PDF IN SMALL CHUNKS
      for (let i = 0; i < totalChunks; i++) {
        while (
          channel.readyState === "open" &&
          channel.bufferedAmount > 256 * 1024
        ) {
          await new Promise((resolve) =>
            setTimeout(resolve, 30)
          );
        }

        if (channel.readyState !== "open") {
          throw new Error(
            "Presentation connection was interrupted."
          );
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(
          start + CHUNK_SIZE,
          buffer.byteLength
        );

        channel.send(buffer.slice(start, end));

        setUploadProgress(
          Math.round(((i + 1) / totalChunks) * 100)
        );
      }

      // TELL STUDENT THAT THE FILE IS COMPLETE
      sendPresentationMessage({
        type: "file-end",
      });

      // DISPLAY PDF ON TUTOR'S SCREEN
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }

      const localUrl = URL.createObjectURL(
        new Blob([buffer], {
          type: "application/pdf",
        })
      );

      pdfUrlRef.current = localUrl;

      setPdfUrl(localUrl);
      setPdfName(file.name);
      setCurrentPage(1);
      setTotalPages(pageCount);

    } catch (err) {
      console.error("PDF upload error:", err);
      setError(
        err.message || "Unable to share the PDF lesson."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // CHANGE PRESENTATION PAGE
  const changePresentationPage = (page) => {
    const newPage = Math.max(
      1,
      Math.min(page, totalPages)
    );

    setCurrentPage(newPage);

    if (isTutor) {
      try {
        sendPresentationMessage({
          type: "page-change",
          page: newPage,
          totalPages,
        });
      } catch (err) {
        console.error("Page synchronization error:", err);
      }
    }
  };

  // CLOSE PRESENTATION
  const closePresentation = () => {
    if (!isTutor) return;

    try {
      sendPresentationMessage({
        type: "presentation-close",
      });
    } catch (err) {
      console.error("Close presentation error:", err);
    }

    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = null;
    }

    setPdfUrl("");
    setPdfName("");
    setCurrentPage(1);
    setTotalPages(1);
  };

  // =====================================
  // WEBRTC CONNECTION
  // =====================================

  // CREATE WEBRTC CONNECTION
  const createPeerConnection = (isCaller) => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peerConnection = new RTCPeerConnection(
      ICE_SERVERS
    );

    peerConnectionRef.current = peerConnection;
    isCallerRef.current = isCaller;

    // BOTH USERS CREATE THE SAME PRESENTATION CHANNEL
const presentationChannel = peerConnection.createDataChannel(
  "presentation",
  {
    negotiated: true,
    id: 0,
  }
);

setupPresentationChannel(presentationChannel);

    remoteStreamRef.current = new MediaStream();

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject =
        remoteStreamRef.current;
    }

    peerConnection.ontrack = (event) => {
      const incomingTracks = event.streams?.[0]?.getTracks();

      if (incomingTracks?.length) {
        incomingTracks.forEach((track) => {
          const alreadyExists = remoteStreamRef.current
            ?.getTracks()
            .some(
              (existingTrack) =>
                existingTrack.id === track.id
            );

          if (!alreadyExists) {
            remoteStreamRef.current?.addTrack(track);
          }
        });
      } else if (event.track) {
        const alreadyExists = remoteStreamRef.current
          ?.getTracks()
          .some(
            (track) => track.id === event.track.id
          );

        if (!alreadyExists) {
          remoteStreamRef.current?.addTrack(event.track);
        }
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject =
          remoteStreamRef.current;
      }
    };

    peerConnection.onicecandidate = async (event) => {
      if (!event.candidate) return;

      const currentCallId = callIdRef.current;

      if (!currentCallId) return;

      try {
        const candidateCollection = collection(
          db,
          "bookings",
          bookingId,
          "videoCall",
          "current",
          isCallerRef.current
            ? "offerCandidates"
            : "answerCandidates"
        );

        await addDoc(candidateCollection, {
          callId: currentCallId,
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          usernameFragment:
            event.candidate.usernameFragment || null,
          senderUid: currentUser.uid,
        });
      } catch (err) {
        console.error("ICE candidate error:", err);
      }
    };

    return peerConnection;
  };

  // ADD LOCAL TRACKS ONLY ONCE
  const addLocalTracks = async (peerConnection) => {
    const stream = await getLocalMedia();

    stream.getTracks().forEach((track) => {
      const alreadyAdded = peerConnection
        .getSenders()
        .some(
          (sender) => sender.track?.id === track.id
        );

      if (!alreadyAdded) {
        peerConnection.addTrack(track, stream);
      }
    });
  };

  // ADD A REMOTE ICE CANDIDATE
  const addRemoteCandidate = async (data) => {
    if (data.senderUid === currentUser.uid) return;

    if (data.callId !== activeCallIdRef.current) return;

    const candidate = new RTCIceCandidate({
      candidate: data.candidate,
      sdpMid: data.sdpMid,
      sdpMLineIndex: data.sdpMLineIndex,
      usernameFragment:
        data.usernameFragment || undefined,
    });

    const peerConnection = peerConnectionRef.current;

    if (peerConnection?.remoteDescription) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (err) {
        console.error(
          "Could not add ICE candidate:",
          err
        );
      }
    } else {
      pendingCandidatesRef.current.push(candidate);
    }
  };

  // PROCESS QUEUED REMOTE ICE CANDIDATES
  const processRemoteCandidates = async () => {
    const peerConnection = peerConnectionRef.current;

    if (!peerConnection?.remoteDescription) return;

    while (pendingCandidatesRef.current.length > 0) {
      const candidate =
        pendingCandidatesRef.current.shift();

      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (err) {
        console.error(
          "Could not add queued ICE candidate:",
          err
        );
      }
    }
  };

  // CLEAN UP CAMERA, MICROPHONE AND CONNECTION
  const cleanupMedia = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ondatachannel = null;

      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (presentationChannelRef.current) {
      presentationChannelRef.current.onmessage = null;
      presentationChannelRef.current.close();
      presentationChannelRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      remoteStreamRef.current = null;
    }

    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = null;
    }

    incomingFileRef.current = null;
    pendingCandidatesRef.current = [];

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setPdfUrl("");
    setPdfName("");
    setCurrentPage(1);
    setTotalPages(1);
    setUploadProgress(0);
  };

  // =====================================
  // START VIDEO CALL
  // =====================================

  
const startCall = async () => {
  if (startingRef.current || endingRef.current) return;

  startingRef.current = true;
  setIsStarting(true);

  try {
    setError("");
    setCallStatus("Checking video call...");

    if (!bookingId || !currentUser?.uid) {
      throw new Error("Missing booking or user information.");
    }

    const otherUid = getOtherParticipantUid();

    if (!otherUid) {
      throw new Error("The other participant could not be found.");
    }

    console.log("START CALL:", {
      bookingId,
      callerUid: currentUser.uid,
      calleeUid: otherUid
    });

    const existingSnapshot = await getDoc(sessionRef);

    if (existingSnapshot.exists()) {
      const existingData = existingSnapshot.data();

      console.log("EXISTING CALL SESSION:", existingData);

      if (!["ended", "declined"].includes(existingData.status)) {
        throw new Error(
          "A call is already active for this booking. Please end the previous call first."
        );
      }

      await deleteDoc(sessionRef);
      console.log("Previous call session deleted.");
    }

    cleanupMedia();

    const newCallId =
      `${Date.now()}_${Math.random().toString(36).slice(2)}`;

    callIdRef.current = newCallId;
    activeCallIdRef.current = newCallId;
    pendingCandidatesRef.current = [];

    setCallStatus("Starting camera and microphone...");

    const peerConnection = createPeerConnection(true);

    await addLocalTracks(peerConnection);

    const offer = await peerConnection.createOffer();

    await peerConnection.setLocalDescription(offer);

    console.log("Saving call session to Firestore...");

    await setDoc(sessionRef, {
      callId: newCallId,
      callerUid: currentUser.uid,
      calleeUid: otherUid,
      offer: {
        type: offer.type,
        sdp: offer.sdp
      },
      answer: null,
      status: "calling",
      updatedAt: serverTimestamp()
    });

    console.log("CALL SESSION SUCCESSFULLY SAVED.");

    await addCallMessage("📹 Video call started");

    setIsCalling(true);
    setCallStatus("Calling the other participant...");

  } catch (err) {
    console.error("START CALL FAILED:", err);
    console.error("ERROR CODE:", err.code);
    console.error("ERROR MESSAGE:", err.message);

    setError(
      err.message || "Unable to start the video call."
    );

    setCallStatus("Call could not start.");

    cleanupMedia();

    callIdRef.current = null;
    activeCallIdRef.current = null;

    setIsCalling(false);

  } finally {
    startingRef.current = false;
    setIsStarting(false);
  }
};


  // =====================================
  // ANSWER INCOMING CALL
  // =====================================

  
const answerCall = async (sessionData) => {
  if (answeringRef.current || endingRef.current) return;

  answeringRef.current = true;

  try {
    setError("");
    setCallStatus("Joining video call...");

    if (!sessionData?.offer || !sessionData?.callId) {
      throw new Error("Invalid incoming call information.");
    }

    if (sessionData.calleeUid !== currentUser.uid) {
      throw new Error("This call is not intended for your account.");
    }

    callIdRef.current = sessionData.callId;
    activeCallIdRef.current = sessionData.callId;

    const peerConnection = createPeerConnection(false);

    await addLocalTracks(peerConnection);

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(sessionData.offer)
    );

    await processRemoteCandidates();

    const answer = await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(answer);

    await updateDoc(sessionRef, {
      answer: {
        type: answer.type,
        sdp: answer.sdp
      },
      status: "connected",
      updatedAt: serverTimestamp()
    });

    await addCallMessage("📹 Joined the video call");

    setIsCalling(true);
    setCallStatus("Connected");

    console.log("CALL ANSWER SUCCESSFULLY SAVED.");

  } catch (err) {
    console.error("ANSWER CALL FAILED:", err);
    console.error("ERROR CODE:", err.code);
    console.error("ERROR MESSAGE:", err.message);

    setError(
      err.message || "Unable to join the video call."
    );

    setCallStatus("Could not join call.");

    cleanupMedia();
    setIsCalling(false);

  } finally {
    answeringRef.current = false;
  }
};


  // =====================================
  // LISTEN FOR CALL AND ICE CANDIDATES
  // =====================================

  useEffect(() => {
    const offerCandidatesRef = collection(
      db,
      "bookings",
      bookingId,
      "videoCall",
      "current",
      "offerCandidates"
    );

    const answerCandidatesRef = collection(
      db,
      "bookings",
      bookingId,
      "videoCall",
      "current",
      "answerCandidates"
    );

    const handleCandidateSnapshot = (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== "added") return;

        const data = change.doc.data();

        if (data.senderUid === currentUser.uid) return;

        if (!activeCallIdRef.current) {
          pendingCandidatesRef.current.push({
            firestoreCandidateData: data,
          });

          return;
        }

        addRemoteCandidate(data);
      });
    };

    const unsubscribeOfferCandidates = onSnapshot(
      offerCandidatesRef,
      handleCandidateSnapshot,
      (err) =>
        console.error(
          "Offer candidates listener:",
          err
        )
    );

    const unsubscribeAnswerCandidates = onSnapshot(
      answerCandidatesRef,
      handleCandidateSnapshot,
      (err) =>
        console.error(
          "Answer candidates listener:",
          err
        )
    );

    const unsubscribeSession = onSnapshot(
      sessionRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          activeCallIdRef.current = null;
          pendingCandidatesRef.current = [];

          setCallStatus(
            "Waiting for the other participant..."
          );

          return;
        }

        const data = snapshot.data();

        if (data.callId) {
          activeCallIdRef.current = data.callId;
          callIdRef.current = data.callId;
        }

        const queuedDocuments =
          pendingCandidatesRef.current.filter(
            (item) => item.firestoreCandidateData
          );

        pendingCandidatesRef.current =
          pendingCandidatesRef.current.filter(
            (item) => !item.firestoreCandidateData
          );

        for (const item of queuedDocuments) {
          await addRemoteCandidate(
            item.firestoreCandidateData
          );
        }

        // AUTOMATICALLY ANSWER INCOMING CALL
        if (
          data.callerUid !== currentUser.uid &&
          data.calleeUid === currentUser.uid &&
          data.status === "calling" &&
          data.offer
        ) {
          await answerCall(data);
        }

        // RECEIVE ANSWER ON CALLER SIDE
        if (
          data.callerUid === currentUser.uid &&
          data.answer &&
          peerConnectionRef.current &&
          !peerConnectionRef.current.remoteDescription
        ) {
          try {
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );

            await processRemoteCandidates();

            setCallStatus("Connected");

          } catch (err) {
            console.error(
              "Set remote answer error:",
              err
            );

            setError(
              "Could not establish the connection."
            );
          }
        }

        if (data.status === "connected") {
          setCallStatus("Connected");
          setIsCalling(true);
        }

        
if (data.status === "declined") {
  setCallStatus("Call was declined.");
  setIsCalling(false);

  if (data.callerUid === currentUser.uid) {
    cleanupMedia();
    callIdRef.current = null;
    activeCallIdRef.current = null;
  }
}

if (data.status === "ended") {
  setCallStatus("Call ended.");
  setIsCalling(false);

  cleanupMedia();

  callIdRef.current = null;
  activeCallIdRef.current = null;
}

      },
      (err) => {
        console.error(
          "Video call listener error:",
          err
        );

        setError(
          "Unable to connect to the video call. Check Firestore permissions."
        );
      }
    );

    return () => {
      unsubscribeSession();
      unsubscribeOfferCandidates();
      unsubscribeAnswerCandidates();
      cleanupMedia();
    };
  }, [bookingId, currentUser.uid]);

  // =====================================
  // MICROPHONE
  // =====================================

  const toggleMicrophone = () => {
    const stream = localStreamRef.current;

    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];

    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  // =====================================
  // CAMERA
  // =====================================

  const toggleCamera = () => {
    const stream = localStreamRef.current;

    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];

    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
    }
  };

  // =====================================
  // END VIDEO CALL
  // =====================================

  
const endCall = async () => {
  if (endingRef.current) return;

  endingRef.current = true;

  try {
    const snapshot = await getDoc(sessionRef);

    if (snapshot.exists()) {
      const sessionData = snapshot.data();

      if (["calling", "connected"].includes(sessionData.status)) {
        await updateDoc(sessionRef, {
          status: "ended",
          updatedAt: serverTimestamp()
        });

        await addCallMessage("📞 Video call ended");
      }
    }

  } catch (err) {
    console.error("END CALL FAILED:", err);
    console.error("ERROR CODE:", err.code);
    console.error("ERROR MESSAGE:", err.message);

    setError(
      err.message || "Unable to end the call properly."
    );
  }

  cleanupMedia();

  callIdRef.current = null;
  activeCallIdRef.current = null;

  setCallStatus("Call ended.");
  setIsCalling(false);
  setIsMicOn(true);
  setIsCameraOn(true);

  endingRef.current = false;

  if (onClose) {
    onClose();
  }
};


  // =====================================
  // USER INTERFACE
  // =====================================

  return (
    <div className="video-call-overlay">
      <div className="video-call-container">

        <div className="video-call-header">
          <div>
            <h2>PeerTutor Video Call</h2>
            <p>
              {booking.subject || "Tutoring Session"}
            </p>
          </div>

          <button
            className="video-close-button"
            onClick={endCall}
            type="button"
            aria-label="End video call"
          >
            ✕
          </button>
        </div>

        <div className="video-call-status">
          <span className="status-dot"></span>
          {callStatus}
        </div>

        {error && (
          <div className="video-call-error">
            {error}
          </div>
        )}

        {/* VIDEO SCREEN */}
        <div className="video-screen-area">
          <div className="remote-video-wrapper">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-video"
            />

            <span className="video-label">
              Other Participant
            </span>
          </div>

          <div className="local-video-wrapper">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="local-video"
            />

            <span className="video-label">
              You
            </span>
          </div>
        </div>

        {/* LESSON PRESENTATION */}
        {pdfUrl && (
          <div className="presentation-container">
            <div className="presentation-header">
              <div>
                <h3>Lesson Presentation</h3>
                <p>{pdfName}</p>
              </div>

              {isTutor && (
                <button
                  type="button"
                  className="presentation-close-button"
                  onClick={closePresentation}
                >
                  Close Lesson
                </button>
              )}
            </div>

            <div className="presentation-viewer">
              <iframe
                key={`${pdfUrl}-${currentPage}`}
                src={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0`}
                title="Lesson Presentation"
              />
            </div>

            <div className="presentation-navigation">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() =>
                  changePresentationPage(currentPage - 1)
                }
              >
                Previous Slide
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  changePresentationPage(currentPage + 1)
                }
              >
                Next Slide
              </button>
            </div>

            {!isTutor && (
              <p className="student-presentation-note">
                The tutor controls the lesson slides.
              </p>
            )}
          </div>
        )}

        {/* VIDEO CALL CONTROLS */}
        <div className="video-call-controls">
          {!isCalling && (
            <button
              className="start-call-button"
              onClick={startCall}
              disabled={isStarting}
              type="button"
            >
              {isStarting
                ? "Starting..."
                : "📹 Start Video Call"}
            </button>
          )}

          {isCalling && (
            <>
              {/* TUTOR PDF UPLOAD */}
              {isTutor && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    hidden
                    onChange={handlePdfUpload}
                  />

                  <button
                    type="button"
                    className="share-lesson-button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={isUploading}
                  >
                    {isUploading
                      ? `Uploading ${uploadProgress}%`
                      : "📚 Share Lesson"}
                  </button>
                </>
              )}

              <button
                className={`call-control-button ${
                  !isMicOn ? "control-off" : ""
                }`}
                onClick={toggleMicrophone}
                type="button"
              >
                {isMicOn ? "🎤 Mic On" : "🔇 Mic Off"}
              </button>

              <button
                className={`call-control-button ${
                  !isCameraOn ? "control-off" : ""
                }`}
                onClick={toggleCamera}
                type="button"
              >
                {isCameraOn
                  ? "📷 Camera On"
                  : "🚫 Camera Off"}
              </button>

              <button
                className="end-call-button"
                onClick={endCall}
                type="button"
              >
                End Call
              </button>
            </>
          )}
        </div>

        {isUploading && (
          <p className="upload-progress-text">
            Sending lesson to student: {uploadProgress}%
          </p>
        )}

      </div>
    </div>
  );
}

export default VideoCall;
