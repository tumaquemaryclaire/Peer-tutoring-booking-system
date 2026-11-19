
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

import { db } from "../services/firebase";
import "./VideoCall.css";

const ICE_SERVERS = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

function VideoCall({ booking, currentUser, onClose }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const isCallerRef = useRef(false);
  const answeringRef = useRef(false);
  const startingRef = useRef(false);
  const endingRef = useRef(false);

  // Unique ID for every call, even when the same booking is reused.
  const callIdRef = useRef(null);
  const activeCallIdRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const [callStatus, setCallStatus] = useState("Waiting for call...");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  const bookingId = booking.id;

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

  // ADD CALL EVENTS TO THE EXISTING CHAT
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

  // CREATE WEBRTC CONNECTION
  const createPeerConnection = (isCaller) => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    peerConnectionRef.current = peerConnection;
    isCallerRef.current = isCaller;

    remoteStreamRef.current = new MediaStream();

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }

    peerConnection.ontrack = (event) => {
      const incomingTracks = event.streams?.[0]?.getTracks();

      if (incomingTracks?.length) {
        incomingTracks.forEach((track) => {
          const alreadyExists = remoteStreamRef.current
            ?.getTracks()
            .some((existingTrack) => existingTrack.id === track.id);

          if (!alreadyExists) {
            remoteStreamRef.current?.addTrack(track);
          }
        });
      } else if (event.track) {
        const alreadyExists = remoteStreamRef.current
          ?.getTracks()
          .some((track) => track.id === event.track.id);

        if (!alreadyExists) {
          remoteStreamRef.current?.addTrack(event.track);
        }
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
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
          usernameFragment: event.candidate.usernameFragment || null,
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
        .some((sender) => sender.track?.id === track.id);

      if (!alreadyAdded) {
        peerConnection.addTrack(track, stream);
      }
    });
  };

  // ADD A REMOTE ICE CANDIDATE
  const addRemoteCandidate = async (data) => {
    if (data.senderUid === currentUser.uid) return;

    // Ignore candidates from previous calls.
    if (data.callId !== activeCallIdRef.current) return;

    const candidate = new RTCIceCandidate({
      candidate: data.candidate,
      sdpMid: data.sdpMid,
      sdpMLineIndex: data.sdpMLineIndex,
      usernameFragment: data.usernameFragment || undefined,
    });

    const peerConnection = peerConnectionRef.current;

    if (peerConnection?.remoteDescription) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (err) {
        console.error("Could not add ICE candidate:", err);
      }
    } else {
      pendingCandidatesRef.current.push(candidate);
    }
  };

  // PROCESS CANDIDATES RECEIVED BEFORE REMOTE DESCRIPTION
  const processRemoteCandidates = async () => {
    const peerConnection = peerConnectionRef.current;

    if (!peerConnection?.remoteDescription) return;

    while (pendingCandidatesRef.current.length > 0) {
      const candidate = pendingCandidatesRef.current.shift();

      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (err) {
        console.error("Could not add queued ICE candidate:", err);
      }
    }
  };

  // CLEAN UP CAMERA, MICROPHONE AND CONNECTION
  const cleanupMedia = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      remoteStreamRef.current = null;
    }

    pendingCandidatesRef.current = [];

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  // START VIDEO CALL
  const startCall = async () => {
    if (startingRef.current || endingRef.current) return;

    startingRef.current = true;
    setIsStarting(true);

    try {
      setError("");
      setCallStatus("Checking video call...");

      const otherUid = getOtherParticipantUid();

      if (!otherUid) {
        throw new Error("The other participant could not be found.");
      }

      // Check the previous call.
      const existingSnapshot = await getDoc(sessionRef);

      if (existingSnapshot.exists()) {
        const existingData = existingSnapshot.data();

        if (existingData.status !== "ended") {
          throw new Error(
            "A call is already active for this booking. Ask the other participant to join that call."
          );
        }

        // Delete only the ended session document.
        // Old ICE candidates are ignored using the new callId.
        await deleteDoc(sessionRef);
      }

      // Reset old connection data before creating a new call.
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

      await setDoc(sessionRef, {
        callId: newCallId,
        callerUid: currentUser.uid,
        calleeUid: otherUid,
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
        answer: null,
        status: "calling",
        updatedAt: serverTimestamp(),
      });

      await addCallMessage("📹 Video call started");

      setIsCalling(true);
      setCallStatus("Calling the other participant...");
    } catch (err) {
      console.error("Start call error:", err);

      setError(err.message || "Unable to start the video call.");
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

  // ANSWER INCOMING CALL
  const answerCall = async (sessionData) => {
    if (answeringRef.current || endingRef.current) return;

    answeringRef.current = true;

    try {
      setError("");
      setCallStatus("Joining video call...");

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
          sdp: answer.sdp,
        },
        status: "connected",
        updatedAt: serverTimestamp(),
      });

      setIsCalling(true);
      setCallStatus("Connected");
    } catch (err) {
      console.error("Answer call error:", err);

      setError(err.message || "Unable to join the video call.");
      setCallStatus("Could not join call.");

      cleanupMedia();
      setIsCalling(false);
      answeringRef.current = false;
    }
  };

  // LISTEN FOR CALL AND ICE CANDIDATES
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

        // If the session has not loaded yet, temporarily queue the document.
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
      (err) => console.error("Offer candidates listener:", err)
    );

    const unsubscribeAnswerCandidates = onSnapshot(
      answerCandidatesRef,
      handleCandidateSnapshot,
      (err) => console.error("Answer candidates listener:", err)
    );

    const unsubscribeSession = onSnapshot(
      sessionRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          activeCallIdRef.current = null;
          pendingCandidatesRef.current = [];
          setCallStatus("Waiting for the other participant...");
          return;
        }

        const data = snapshot.data();

        // Set the active call ID before processing candidates.
        if (data.callId) {
          activeCallIdRef.current = data.callId;
          callIdRef.current = data.callId;
        }

        // Process candidate documents that arrived before the session.
        const queuedDocuments = pendingCandidatesRef.current.filter(
          (item) => item.firestoreCandidateData
        );

        pendingCandidatesRef.current = pendingCandidatesRef.current.filter(
          (item) => !item.firestoreCandidateData
        );

        for (const item of queuedDocuments) {
          await addRemoteCandidate(item.firestoreCandidateData);
        }

        // Automatically answer when the other participant starts a call.
        if (
          data.callerUid !== currentUser.uid &&
          data.calleeUid === currentUser.uid &&
          data.status === "calling" &&
          data.offer
        ) {
          await answerCall(data);
        }

        // Receive the answer on the caller's side.
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
            console.error("Set remote answer error:", err);
            setError("Could not establish the connection.");
          }
        }

        if (data.status === "connected") {
          setCallStatus("Connected");
          setIsCalling(true);
        }

        if (data.status === "ended") {
          setCallStatus("Call ended.");
          setIsCalling(false);
          cleanupMedia();
        }
      },
      (err) => {
        console.error("Video call listener error:", err);
        setError("Unable to connect to the video call. Check Firestore permissions.");
      }
    );

    return () => {
      unsubscribeSession();
      unsubscribeOfferCandidates();
      unsubscribeAnswerCandidates();
      cleanupMedia();
    };
  }, [bookingId, currentUser.uid]);

  // TOGGLE MICROPHONE
  const toggleMicrophone = () => {
    const stream = localStreamRef.current;

    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];

    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  // TOGGLE CAMERA
  const toggleCamera = () => {
    const stream = localStreamRef.current;

    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];

    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
    }
  };

  // END VIDEO CALL
  const endCall = async () => {
    if (endingRef.current) return;

    endingRef.current = true;

    try {
      const snapshot = await getDoc(sessionRef);

      if (
        snapshot.exists() &&
        snapshot.data().status !== "ended"
      ) {
        await updateDoc(sessionRef, {
          status: "ended",
          updatedAt: serverTimestamp(),
        });

        await addCallMessage("📞 Video call ended");
      }
    } catch (err) {
      console.error("End call error:", err);
      setError(err.message || "Unable to end the call properly.");
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

  return (
    <div className="video-call-overlay">
      <div className="video-call-container">
        <div className="video-call-header">
          <div>
            <h2>PeerTutor Video Call</h2>
            <p>{booking.subject || "Tutoring Session"}</p>
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

        <div className="video-call-controls">
          {!isCalling && (
            <button
              className="start-call-button"
              onClick={startCall}
              disabled={isStarting}
              type="button"
            >
              {isStarting ? "Starting..." : "📹 Start Video Call"}
            </button>
          )}

          {isCalling && (
            <>
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
                {isCameraOn ? "📷 Camera On" : "🚫 Camera Off"}
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
      </div>
    </div>
  );
}

export default VideoCall;
