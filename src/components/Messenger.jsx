
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";

import { db } from "../services/firebase";
import {
  getConversationId,
  createOrUpdateConversation
} from "../services/conversations";
import VideoCall from "./VideoCall";
import "./Messenger.css";

function Messenger({
  currentUser,
  bookings = [],
  initialConversationId = ""
}) {
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
      booking.teachingMode === "Online" &&
      booking.studentUid &&
      booking.tutorUid
  );

  // One conversation per student-tutor pair
  const uniqueBookings = Object.values(
    eligibleBookings.reduce((result, booking) => {
      const conversationId = getConversationId(
        booking.studentUid,
        booking.tutorUid
      );

      const existingBooking = result[conversationId];

      const newTime = booking.createdAt?.toMillis?.() || 0;
      const existingTime = existingBooking?.createdAt?.toMillis?.() || 0;

      if (!existingBooking || newTime >= existingTime) {
        result[conversationId] = booking;
      }

      return result;
    }, {})
  );

  const getOtherPersonName = (booking) => {
    if (!booking) return "Conversation";

    if (currentUser?.uid === booking.studentUid) {
      return booking.tutorName || "Tutor";
    }

    return booking.studentName || "Student";
  };

  const getSelectedConversationId = () => {
    if (!selectedBooking) return null;

    return getConversationId(
      selectedBooking.studentUid,
      selectedBooking.tutorUid
    );
  };

  // Automatically select the first conversation if none is selected
  useEffect(() => {
    if (uniqueBookings.length === 0) {
      setSelectedBooking(null);
      setMessages([]);
      return;
    }

    const selectedStillExists = uniqueBookings.some(
      (booking) =>
        getConversationId(booking.studentUid, booking.tutorUid) ===
        (selectedBooking
          ? getConversationId(
              selectedBooking.studentUid,
              selectedBooking.tutorUid
            )
          : null)
    );

    if (!selectedStillExists && !initialConversationId) {
      setSelectedBooking(uniqueBookings[0]);
    }
  }, [bookings, selectedBooking?.id, initialConversationId]);

  // Open the requested conversation from a notification or booking
  useEffect(() => {
    if (!initialConversationId || uniqueBookings.length === 0) {
      return;
    }

    const matchingBooking = uniqueBookings.find(
      (booking) =>
        getConversationId(
          booking.studentUid,
          booking.tutorUid
        ) === initialConversationId
    );

    if (matchingBooking) {
      setSelectedBooking(matchingBooking);
      setError("");
    }
  }, [initialConversationId, bookings]);

  // Create/load shared conversation and listen for messages
  useEffect(() => {
    if (!selectedBooking || !currentUser?.uid) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    let unsubscribe = null;
    let cancelled = false;

    setLoadingMessages(true);
    setError("");

    const loadConversation = async () => {
      try {
        const conversationId = await createOrUpdateConversation(
          selectedBooking
        );

        if (cancelled) return;

        const messagesRef = collection(
          db,
          "conversations",
          conversationId,
          "messages"
        );

        unsubscribe = onSnapshot(
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
            setError(
              "Unable to load messages. Please check your connection."
            );
            setLoadingMessages(false);
          }
        );
      } catch (err) {
        console.error("Conversation loading error:", err);
        setError("Unable to open this conversation. Please try again.");
        setLoadingMessages(false);
      }
    };

    loadConversation();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [selectedBooking?.id, currentUser?.uid]);

  // Format message time
  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return "";

    return timestamp.toDate().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Send message and notify the receiver
  const handleSendMessage = async (e) => {
    e.preventDefault();

    const text = messageText.trim();

    if (!text || !selectedBooking || sending) return;

    if (!currentUser?.uid) {
      setError("Please log in again to send messages.");
      return;
    }

    const isStudent =
      currentUser.uid === selectedBooking.studentUid;

    const isTutor =
      currentUser.uid === selectedBooking.tutorUid;

    if (!isStudent && !isTutor) {
      setError(
        "You are not allowed to send messages in this conversation."
      );
      return;
    }

    setSending(true);
    setError("");

    try {
      const conversationId = getSelectedConversationId();

      const conversationRef = doc(
        db,
        "conversations",
        conversationId
      );

      const newMessageRef = doc(
        collection(
          db,
          "conversations",
          conversationId,
          "messages"
        )
      );

      const recipientUid = isStudent
        ? selectedBooking.tutorUid
        : selectedBooking.studentUid;

      const senderName = isStudent
        ? selectedBooking.studentName || "Student"
        : selectedBooking.tutorName || "Tutor";

      const notificationRef = doc(
        collection(db, "notifications")
      );

      const batch = writeBatch(db);

      // Save message
      batch.set(newMessageRef, {
        senderUid: currentUser.uid,
        text,
        createdAt: serverTimestamp()
      });

      // Update conversation preview
      batch.update(conversationRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        lastSenderUid: currentUser.uid,
        latestBookingId: selectedBooking.id,
        updatedAt: serverTimestamp()
      });

      // Create notification for the other participant
      batch.set(notificationRef, {
        recipientUid,
        senderUid: currentUser.uid,
        title: "New Message",
        message: `You have a new message from ${senderName}.`,
        type: "Message",
        bookingId: selectedBooking.id,
        conversationId,
        read: false,
        createdAt: serverTimestamp()
      });

      await batch.commit();

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
              {uniqueBookings.map((booking) => {
                const conversationId = getConversationId(
                  booking.studentUid,
                  booking.tutorUid
                );

                const selectedConversationId = selectedBooking
                  ? getConversationId(
                      selectedBooking.studentUid,
                      selectedBooking.tutorUid
                    )
                  : null;

                return (
                  <button
                    key={conversationId}
                    className={`conversation-item ${
                      selectedConversationId === conversationId
                        ? "selected"
                        : ""
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
                      <span>
                        {booking.subject || "Tutoring session"}
                      </span>
                      <small>
                        {booking.preferredDate || "Online tutoring"}
                      </small>
                    </div>

                    <span className="online-booking-dot"></span>
                  </button>
                );
              })}
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
                    onClick={() =>
                      setActiveVideoBooking(selectedBooking)
                    }
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
