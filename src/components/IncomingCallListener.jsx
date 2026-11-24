
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
  serverTimestamp
} from "firebase/firestore";

import { auth, db } from "../services/firebase";
import VideoCall from "./VideoCall";

export default function IncomingCallListener() {
  const [currentUser, setCurrentUser] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [acceptedCall, setAcceptedCall] = useState(null);

  const bookingListenersRef = useRef(new Map());
  const acceptedCallRef = useRef(null);

  // =====================================
  // AUTHENTICATED USER
  // =====================================
  useEffect(() => {
    let mounted = true;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setIncomingCall(null);
        setAcceptedCall(null);
        acceptedCallRef.current = null;
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        let userData = {};

        if (userSnap.exists()) {
          userData = userSnap.data();
        } else {
          const savedUser = sessionStorage.getItem("pt_current_user");

          if (savedUser) {
            userData = JSON.parse(savedUser);
          }
        }

        if (!mounted) return;

        setCurrentUser({
          ...userData,
          uid: user.uid,
          email: user.email || userData.email || ""
        });
      } catch (error) {
        console.error("Unable to load current user:", error);
      }
    });

    return () => {
      mounted = false;
      unsubscribeAuth();
    };
  }, []);

  // =====================================
  // LISTEN FOR INCOMING CALLS
  // =====================================
  useEffect(() => {
    if (!currentUser?.uid) return;

    const uid = currentUser.uid;
    let active = true;

    const bookingListeners = bookingListenersRef.current;

    const isEligibleBooking = (booking) => {
      return (
        booking.teachingMode === "Online" &&
        ["Accepted", "Awaiting Confirmation", "Completed"].includes(
          booking.status
        ) &&
        (booking.studentUid === uid || booking.tutorUid === uid)
      );
    };

    const attachCallListener = (bookingId, booking) => {
      if (!active) return;

      if (!isEligibleBooking(booking)) {
        const existing = bookingListeners.get(bookingId);

        if (existing) {
          existing();
          bookingListeners.delete(bookingId);
        }

        return;
      }

      if (bookingListeners.has(bookingId)) return;

      const sessionRef = doc(
        db,
        "bookings",
        bookingId,
        "videoCall",
        "current"
      );

      const unsubscribeSession = onSnapshot(
        sessionRef,
        (sessionSnap) => {
          if (!active || !sessionSnap.exists()) return;

          const sessionData = sessionSnap.data();

          const isIncoming =
            sessionData.status === "calling" &&
            sessionData.calleeUid === uid &&
            sessionData.callerUid !== uid &&
            sessionData.offer?.type === "offer" &&
            typeof sessionData.offer?.sdp === "string";

          if (!isIncoming) {
            setIncomingCall((previous) =>
              previous?.bookingId === bookingId ? null : previous
            );
            return;
          }

          if (acceptedCallRef.current?.bookingId === bookingId) {
            return;
          }

          const callerName =
            sessionData.callerUid === booking.studentUid
              ? booking.studentName
              : booking.tutorName;

          setIncomingCall({
            bookingId,
            booking,
            sessionData,
            callerName: callerName || "PeerTutor User",
            subject: booking.subject || "Tutoring Session"
          });
        },
        (error) => {
          console.error(
            "Incoming call listener error:",
            error
          );
        }
      );

      bookingListeners.set(bookingId, unsubscribeSession);
    };

    const listenToBookings = (field) => {
      const bookingsQuery = query(
        collection(db, "bookings"),
        where(field, "==", uid)
      );

      return onSnapshot(
        bookingsQuery,
        (snapshot) => {
          if (!active) return;

          snapshot.docChanges().forEach((change) => {
            const bookingId = change.doc.id;
            const booking = {
              id: bookingId,
              ...change.doc.data()
            };

            if (change.type === "removed") {
              const existing = bookingListeners.get(bookingId);

              if (existing) {
                existing();
                bookingListeners.delete(bookingId);
              }

              setIncomingCall((previous) =>
                previous?.bookingId === bookingId ? null : previous
              );

              return;
            }

            attachCallListener(bookingId, booking);
          });
        },
        (error) => {
          console.error(
            `Booking listener error (${field}):`,
            error
          );
        }
      );
    };

    const unsubscribeStudentBookings =
      listenToBookings("studentUid");

    const unsubscribeTutorBookings =
      listenToBookings("tutorUid");

    return () => {
      active = false;

      unsubscribeStudentBookings();
      unsubscribeTutorBookings();

      bookingListeners.forEach((unsubscribe) => unsubscribe());
      bookingListeners.clear();
    };
  }, [currentUser?.uid]);

  // =====================================
  // ACCEPT CALL
  // =====================================
  const handleAcceptCall = () => {
    if (!incomingCall) return;

    acceptedCallRef.current = incomingCall;

    setAcceptedCall(incomingCall);
    setIncomingCall(null);
  };

  // =====================================
  // DECLINE CALL
  // =====================================
  const handleDeclineCall = async () => {
    if (!incomingCall) return;

    const call = incomingCall;

    setIncomingCall(null);

    try {
      const sessionRef = doc(
        db,
        "bookings",
        call.bookingId,
        "videoCall",
        "current"
      );

      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) return;

      const latestSession = sessionSnap.data();

      if (
        latestSession.status !== "calling" ||
        latestSession.calleeUid !== currentUser.uid
      ) {
        return;
      }

      await updateDoc(sessionRef, {
        status: "declined",
        updatedAt: serverTimestamp()
      });

      console.log("Incoming call declined.");
    } catch (error) {
      console.error("Unable to decline call:", error);
      alert("Unable to decline the call. Please try again.");
    }
  };

  // =====================================
  // CLOSE ACCEPTED CALL
  // =====================================
  const handleCloseAcceptedCall = () => {
    setAcceptedCall(null);
    acceptedCallRef.current = null;
  };

  // =====================================
  // INCOMING CALL POPUP
  // =====================================
  return (
    <>
      {incomingCall && !acceptedCall && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 99999,
            width: "320px",
            maxWidth: "calc(100vw - 40px)",
            padding: "22px",
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 8px 35px rgba(0,0,0,0.25)",
            color: "#222"
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "50%",
                background: "#e8f0ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
                fontSize: "28px"
              }}
            >
              📹
            </div>

            <h3 style={{ margin: "0 0 6px" }}>
              Incoming Video Call
            </h3>

            <p style={{ margin: "0 0 5px", fontWeight: "600" }}>
              {incomingCall.callerName}
            </p>

            <p style={{ margin: "0 0 20px", color: "#777" }}>
              {incomingCall.subject}
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px"
              }}
            >
              <button
                type="button"
                onClick={handleDeclineCall}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#e53935",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Decline
              </button>

              <button
                type="button"
                onClick={handleAcceptCall}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#16a34a",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACCEPTED VIDEO CALL */}
      {acceptedCall && currentUser && (
        <VideoCall
          booking={acceptedCall.booking}
          currentUser={currentUser}
          incomingCallData={acceptedCall.sessionData}
          onClose={handleCloseAcceptedCall}
        />
      )}
    </>
  );
}
