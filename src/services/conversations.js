
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch
} from "firebase/firestore";

import { db } from "./firebase";

// One conversation for each student-tutor pair
export function getConversationId(studentUid, tutorUid) {
  if (!studentUid || !tutorUid) {
    throw new Error("Student UID and Tutor UID are required.");
  }

  return `${studentUid}_${tutorUid}`;
}

// Create or update the conversation document
export async function createOrUpdateConversation(booking) {
  if (!booking?.studentUid || !booking?.tutorUid) {
    throw new Error("Invalid booking participants.");
  }

  const conversationId = getConversationId(
    booking.studentUid,
    booking.tutorUid
  );

  const conversationRef = doc(
    db,
    "conversations",
    conversationId
  );

  await setDoc(
    conversationRef,
    {
      studentUid: booking.studentUid,
      tutorUid: booking.tutorUid,
      studentName: booking.studentName || "Student",
      tutorName: booking.tutorName || "Tutor",
      latestBookingId: booking.id,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return conversationId;
}

// Copy old booking messages into the shared conversation.
// Original messages remain in their old booking locations.

export async function migrateOldMessages(bookings) {
  const validBookings = bookings.filter(
    (booking) =>
      booking?.id &&
      booking?.studentUid &&
      booking?.tutorUid
  );

  for (const booking of validBookings) {
    const conversationId = await createOrUpdateConversation(booking);

    const oldMessagesRef = collection(
      db,
      "bookings",
      booking.id,
      "messages"
    );

    const oldMessagesSnapshot = await getDocs(oldMessagesRef);

    let batch = writeBatch(db);
    let batchCount = 0;

    for (const oldMessage of oldMessagesSnapshot.docs) {
      const oldData = oldMessage.data();

      if (!oldData.senderUid || !oldData.text?.trim()) {
        continue;
      }

      const newMessageId = `legacy_${booking.id}_${oldMessage.id}`;

      const newMessageRef = doc(
        db,
        "conversations",
        conversationId,
        "messages",
        newMessageId
      );

      // Do not copy a message that already exists
      const existingMessage = await getDoc(newMessageRef);

      if (existingMessage.exists()) {
        continue;
      }

      batch.set(newMessageRef, {
        senderUid: oldData.senderUid,
        text: oldData.text,
        createdAt: oldData.createdAt || null,
        sourceBookingId: booking.id,
        sourceMessageId: oldMessage.id,
        migrated: true
      });

      batchCount++;

      if (batchCount === 450) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }
  }

  return true;
}
