
import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
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
  const remoteCandidatesRef = useRef([]);

  const [callStatus, setCallStatus] = useState("Waiting for call...");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const [error, setError] = useState("");

  const bookingId = booking.id;
  const sessionRef = doc(db, "bookings", bookingId, "videoCall", "current");

  const getOtherParticipantUid = () => {
    return currentUser.uid === booking.studentUid
      ? booking.tutorUid
      : booking.studentUid;
  };

  const getLocalMedia = async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
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
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
      });

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    };

    peerConnection.onicecandidate = async (event) => {
      if (!event.candidate) return;

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

  const addLocalTracks = async (peerConnection) => {
    const stream = await getLocalMedia();

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });
  };

  const processRemoteCandidates = async () => {
    const peerConnection = peerConnectionRef.current;

    if (!peerConnection?.remoteDescription) return;

    while (remoteCandidatesRef.current.length > 0) {
      const candidate = remoteCandidatesRef.current.shift();

      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (err) {
        console.error("Could not add ICE candidate:", err);
      }
    }
  };

  const startCall = async () => {
    try {
      setError("");
      setCallStatus("Starting camera and microphone...");
      setIsCalling(true);

      const otherUid = getOtherParticipantUid();

      if (!otherUid) {
        throw new Error("The other participant could not be found.");
      }

      const peerConnection = createPeerConnection(true);

      await addLocalTracks(peerConnection);

      const existingSession = await new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(
          sessionRef,
          (snapshot) => {
            unsubscribe();
            resolve(snapshot.exists() ? snapshot.data() : null);
          },
          reject
        );
      });

      if (existingSession && existingSession.status !== "ended") {
        throw new Error(
          "A call already exists for this booking. Please join the existing call."
        );
      }

      if (existingSession?.status === "ended") {
        await deleteDoc(sessionRef);
      }

      const offer = await peerConnection.createOffer();

      await peerConnection.setLocalDescription(offer);

      await setDoc(sessionRef, {
        callerUid: currentUser.uid,
        calleeUid: otherUid,
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
        answer: null,
        status: "calling",
        updatedAt: new Date(),
      });

      setCallStatus("Calling the other participant...");
    } catch (err) {
      console.error("Start call error:", err);
      setError(err.message || "Unable to start the video call.");
      setCallStatus("Call could not start.");
      setIsCalling(false);
    }
  };

  const answerCall = async (sessionData) => {
    if (answeringRef.current) return;

    answeringRef.current = true;

    try {
      setError("");
      setCallStatus("Joining video call...");

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
        updatedAt: new Date(),
      });

      setIsCalling(true);
      setCallStatus("Connected");
    } catch (err) {
      console.error("Answer call error:", err);
      setError(err.message || "Unable to join the video call.");
      setCallStatus("Could not join call.");
      answeringRef.current = false;
    }
  };

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

    const unsubscribeOfferCandidates = onSnapshot(
      offerCandidatesRef,
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type !== "added") return;

          const data = change.doc.data();

          if (data.senderUid === currentUser.uid) return;

          const candidate = new RTCIceCandidate({
            candidate: data.candidate,
            sdpMid: data.sdpMid,
            sdpMLineIndex: data.sdpMLineIndex,
            usernameFragment: data.usernameFragment || undefined,
          });

          if (peerConnectionRef.current?.remoteDescription) {
            try {
              await peerConnectionRef.current.addIceCandidate(candidate);
            } catch (err) {
              console.error("Offer candidate error:", err);
            }
          } else {
            remoteCandidatesRef.current.push(candidate);
          }
        });
      }
    );

    const unsubscribeAnswerCandidates = onSnapshot(
      answerCandidatesRef,
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type !== "added") return;

          const data = change.doc.data();

          if (data.senderUid === currentUser.uid) return;

          const candidate = new RTCIceCandidate({
            candidate: data.candidate,
            sdpMid: data.sdpMid,
            sdpMLineIndex: data.sdpMLineIndex,
            usernameFragment: data.usernameFragment || undefined,
          });

          if (peerConnectionRef.current?.remoteDescription) {
            try {
              await peerConnectionRef.current.addIceCandidate(candidate);
            } catch (err) {
              console.error("Answer candidate error:", err);
            }
          } else {
            remoteCandidatesRef.current.push(candidate);
          }
        });
      }
    );

    const unsubscribeSession = onSnapshot(
      sessionRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          setCallStatus("Waiting for the other participant...");
          return;
        }

        const data = snapshot.data();

        if (
          data.callerUid !== currentUser.uid &&
          data.calleeUid === currentUser.uid &&
          data.status === "calling" &&
          data.offer
        ) {
          await answerCall(data);
        }

        if (
          data.callerUid === currentUser.uid &&
          data.answer &&
          peerConnectionRef.current &&
          !peerConnectionRef.current.currentRemoteDescription
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
        }

        if (data.status === "ended") {
          setCallStatus("Call ended.");
          cleanupMedia();
        }
      }
    );

    return () => {
      unsubscribeSession();
      unsubscribeOfferCandidates();
      unsubscribeAnswerCandidates();
      cleanupMedia();
    };
  }, [bookingId, currentUser.uid]);

  const cleanupMedia = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const toggleMicrophone = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];

    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];

    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
    }
  };

  const endCall = async () => {
    try {
      await updateDoc(sessionRef, {
        status: "ended",
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error("End call error:", err);
    }

    cleanupMedia();
    setCallStatus("Call ended.");
    setIsCalling(false);

    if (onClose) onClose();
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
            onClick={onClose}
            type="button"
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

            <span className="video-label">Other Participant</span>
          </div>

          <div className="local-video-wrapper">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="local-video"
            />

            <span className="video-label">You</span>
          </div>

        </div>

        <div className="video-call-controls">

          {!isCalling && (
            <button
              className="start-call-button"
              onClick={startCall}
              type="button"
            >
              <span>📹</span>
              Start Video Call
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
