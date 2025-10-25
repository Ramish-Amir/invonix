import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin SDK only if credentials are available
let auth: any = null;
let db: any = null;

if (!getApps().length) {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    try {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
      auth = getAuth();
      db = getFirestore();
    } catch (error) {
      console.error("Failed to initialize Firebase Admin SDK:", error);
    }
  } else {
    console.warn(
      "Firebase Admin SDK credentials not found. Admin functions will be disabled."
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Admin SDK is initialized
    if (!auth || !db) {
      return NextResponse.json(
        {
          error:
            "Firebase Admin SDK not initialized. Please configure service account credentials.",
        },
        { status: 503 }
      );
    }

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
