
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../services/firebase";
import VideoCall from "./VideoCall";
import "./Messenger.css";

function Messenger({ currentUser, bookings = [] }) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [activeVideoBooking, setActiveVideoBooking] = useState(null);

  // Accepted, awaiting confirmation, and completed online bookings
const eligibleBookings = bookings.filter(
  (booking) =>
    ["Accepted", "Awaiting Confirmation", "Completed"].includes(
      booking.status
    ) &&
    booking.teachingMode === "Online"
);

  // Get the other participant's UID
  const getConversationKey = (booking) => {
    return currentUser?.role === "tutor"
      ? booking.studentUid
      : booking.tutorUid;
  };

  // Keep every booking conversation separate.
// Each booking has its own messages subcollection.
const uniqueBookings = eligibleBookings;

  // Automatically select the first conversation
  useEffect(() => {
    if (uniqueBookings.length === 0) {
      setSelectedBooking(null);
      return;
    }

    const selectedStillExists = uniqueBookings.some(
      (booking) => booking.id === selectedBooking?.id
    );

    if (!selectedStillExists) {
      setSelectedBooking(uniqueBookings[0]);
    }
  }, [bookings, selectedBooking?.id]);

  // Load messages in real time
  useEffect(() => {
    if (!selectedBooking?.id || !currentUser?.uid) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    setError("");

    const messagesRef = collection(
      db,
      "bookings",
      selectedBooking.id,
      "messages"
    );

    const unsubscribe = onSnapshot(
      messagesRef,
      (snapshot) => {
        const loadedMessages = snapshot.docs.map((messageDoc) => ({
          id: messageDoc.id,
          ...messageDoc.data()
        }));

        loadedMessages.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeA - timeB;
        });

        setMessages(loadedMessages);
        setLoadingMessages(false);
      },
      (err) => {
        console.error("Message loading error:", err);
        setError("Unable to load messages. Please check your connection.");
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [selectedBooking?.id, currentUser?.uid]);

  // Get the other person's name
  const getOtherPersonName = (booking) => {
    if (!booking) return "Conversation";

    if (currentUser?.uid === booking.studentUid) {
      return booking.tutorName || "Tutor";
    }

    return booking.studentName || "Student";
  };

  // Format message time
  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return "";

    return timestamp.toDate().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    const text = messageText.trim();

    if (!text || !selectedBooking || sending) return;

    if (!currentUser?.uid) {
      setError("Please log in again to send messages.");
      return;
    }

    setSending(true);
    setError("");

    try {
      await addDoc(
        collection(
          db,
          "bookings",
          selectedBooking.id,
          "messages"
        ),
        {
          senderUid: currentUser.uid,
          text,
          createdAt: serverTimestamp()
        }
      );

      setMessageText("");
    } catch (err) {
      console.error("Send message error:", err);
      setError("Message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="messenger-page">
      <div className="messenger-heading">
        <div>
          <h2>Messages</h2>
          <p>Chat with your confirmed online tutoring partner.</p>
        </div>
      </div>

      {uniqueBookings.length === 0 ? (
        <div className="messenger-empty">
          <div className="messenger-empty-icon">✉</div>
          <h3>No Conversations Yet</h3>
          <p>
            You can chat here when you have an accepted online
            tutoring booking.
          </p>
        </div>
      ) : (
        <div className="messenger-container">
          <aside className="conversation-sidebar">
            <div className="conversation-sidebar-header">
              <h3>Conversations</h3>
              <span>{uniqueBookings.length}</span>
            </div>

            <div className="conversation-list">
              {uniqueBookings.map((booking) => (
                <button
                  key={booking.id}
                  className={`conversation-item ${
                    selectedBooking?.id === booking.id ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedBooking(booking);
                    setError("");
                    setActiveVideoBooking(null);
                  }}
                  type="button"
                >
                  <div className="conversation-avatar">
                    {getOtherPersonName(booking)
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="conversation-info">
                    <strong>{getOtherPersonName(booking)}</strong>
                    <span>{booking.subject || "Tutoring session"}</span>
                    <small>
                      {booking.preferredDate || "Online tutoring"}
                    </small>
                  </div>

                  <span className="online-booking-dot"></span>
                </button>
              ))}
            </div>
          </aside>

          <section className="chat-window">
            {selectedBooking && (
              <>
                <div className="chat-header">
                  <div className="conversation-avatar">
                    {getOtherPersonName(selectedBooking)
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="chat-header-info">
                    <strong>
                      {getOtherPersonName(selectedBooking)}
                    </strong>
                    <span>
                      {selectedBooking.subject || "Online tutoring"} ·
                      {" "}Online Tutoring
                    </span>
                  </div>

                  <button
                    className="video-chat-button"
                    type="button"
                    onClick={() => setActiveVideoBooking(selectedBooking)}
                  >
                    <span>📹</span>
                    Video Call
                  </button>
                </div>

                <div className="chat-messages">
                  {loadingMessages ? (
                    <div className="chat-notice">
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="chat-notice">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMine =
                        message.senderUid === currentUser.uid;

                      return (
                        <div
                          key={message.id}
                          className={`message-row ${
                            isMine
                              ? "my-message-row"
                              : "their-message-row"
                          }`}
                        >
                          <div
                            className={`message-bubble ${
                              isMine
                                ? "my-message"
                                : "their-message"
                            }`}
                          >
                            <p>{message.text}</p>
                            <small>
                              {formatTime(message.createdAt)}
                            </small>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {error && (
                  <div className="messenger-error">
                    {error}
                  </div>
                )}

                <form
                  className="chat-input-area"
                  onSubmit={handleSendMessage}
                >
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    maxLength={2000}
                  />

                  <button
                    type="submit"
                    disabled={!messageText.trim() || sending}
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}

      {activeVideoBooking && (
        <VideoCall
          booking={activeVideoBooking}
          currentUser={currentUser}
          onClose={() => setActiveVideoBooking(null)}
        />
      )}
    </div>
  );
}

export default Messenger;
