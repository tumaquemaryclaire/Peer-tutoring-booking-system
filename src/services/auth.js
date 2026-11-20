
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import {
  doc,
  setDoc
} from "firebase/firestore";

import { auth, db } from "./firebase";

// REGISTER USER
export async function registerUser(userData) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    userData.email,
    userData.password
  );

  const user = userCredential.user;

  // OPTIONAL NAME FIELDS
  const middleName = userData.middleName?.trim() || "";
  const suffix = userData.suffix?.trim() || "";

  // COMPLETE NAME
  const fullName = [
    userData.firstName.trim(),
    middleName,
    userData.lastName.trim()
  ].filter(Boolean).join(" ") + (suffix ? `, ${suffix}` : "");

  // PRIVATE USER INFORMATION
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    firstName: userData.firstName,
    middleName,
    lastName: userData.lastName,
    suffix,
    fullName,
    birthday: userData.birthday || "",
    contactNumber: userData.contactNumber,
    email: userData.email,
    role: userData.role,
    status: "Active",
    createdAt: new Date().toISOString()
  });

  // PUBLIC TUTOR PROFILE
  if (userData.role === "tutor") {
    await setDoc(doc(db, "tutorProfiles", user.uid), {
      uid: user.uid,
      firstName: userData.firstName,
      middleName,
      lastName: userData.lastName,
      suffix,
      fullName,
      subjects: [],
      bio: "",
      teachingMode: "",
      status: "Active",
      createdAt: new Date().toISOString()
    });
  }

  return user;
}

// LOGIN USER
export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return userCredential.user;
}

// LOGOUT USER
export async function logoutUser() {
  await signOut(auth);
}
