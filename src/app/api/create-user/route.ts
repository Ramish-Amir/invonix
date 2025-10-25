import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      role,
      companyId,
    } = body;

    // Verify the request is from an admin user
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const decodedToken = await auth.verifyIdToken(token);

    // Check if the user is admin
    if (decodedToken.uid !== process.env.NEXT_PUBLIC_ADMIN_USER_ID) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create user with Admin SDK (doesn't change current auth state)
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      phoneNumber: phoneNumber || undefined,
    });

    // Store user data in adminUsers collection
    await db
      .collection("adminUsers")
      .doc(userRecord.uid)
      .set({
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber || null,
        role,
        companyId,
        createdAt: new Date().toISOString(),
        createdBy: decodedToken.uid,
      });

    // Store user data in company's users subcollection
    await db
      .collection("companies")
      .doc(companyId)
      .collection("users")
      .doc(userRecord.uid)
      .set({
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber || null,
        role,
        companyId,
        createdAt: new Date().toISOString(),
        createdBy: decodedToken.uid,
      });

    return NextResponse.json({
      success: true,
      userId: userRecord.uid,
      message: "User created successfully",
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
