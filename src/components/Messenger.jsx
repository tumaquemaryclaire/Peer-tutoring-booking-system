
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../services/firebase";
import "./Messenger.css";

function Messenger({ currentUser, bookings = [] }) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // FILTER ACCEPTED ONLINE BOOKINGS
  const eligibleBookings = bookings.filter(
    (booking) =>
      booking.status === "Accepted" &&
      booking.teachingMode === "Online"
  );

  // SHOW ONLY ONE CONVERSATION PER TUTOR
  // Keep the newest booking because StudentDashboard sorts bookings newest first.
  const getConversationKey = (booking) => {
  return currentUser?.role === "tutor"
    ? booking.studentUid
    : booking.tutorUid;
};

const uniqueBookings = [
  ...new Map(
    eligibleBookings.map((booking) => [
      getConversationKey(booking) || booking.id,
      booking
    ])
  ).values()
];

  // SELECT FIRST AVAILABLE CONVERSATION
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

  // LOAD MESSAGES IN REAL TIME
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

  // GET OTHER PERSON'S NAME
  const getOtherPersonName = (booking) => {
    if (!booking) return "Conversation";

    if (currentUser?.uid === booking.studentUid) {
      return booking.tutorName || "Tutor";
    }

    return booking.studentName || "Student";
  };

  // FORMAT MESSAGE TIME
  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return "";

    return timestamp.toDate().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // SEND MESSAGE
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
            <h3>Conversations</h3>

            {uniqueBookings.map((booking) => (
              <button
                key={booking.tutorUid || booking.id}
                className={`conversation-item ${
                  selectedBooking?.id === booking.id ? "selected" : ""
                }`}
                onClick={() => {
                  setSelectedBooking(booking);
                  setError("");
                }}
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
              </button>
            ))}
          </aside>

          <section className="chat-area">
            {selectedBooking && (
              <>
                <div className="chat-header">
                  <div className="conversation-avatar">
                    {getOtherPersonName(selectedBooking)
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h3>{getOtherPersonName(selectedBooking)}</h3>
                    <span>
                      {selectedBooking.subject || "Online tutoring"} ·
                      {" "}Online Tutoring
                    </span>
                  </div>
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
                            <span>
                              {formatTime(message.createdAt)}
                            </span>
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
    </div>
  );
}

export default Messenger;
