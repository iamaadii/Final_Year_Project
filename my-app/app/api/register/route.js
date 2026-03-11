import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { isValidEmail, validatePassword } from "@/lib/validators";

export async function POST(req) {
  try {
    await dbConnect();

    const { name, email, password, userType } = await req.json();

    if (!name || !email || !password || !userType) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const allowedUserTypes = ["Buyer", "Seller", "Financier"];
    if (!allowedUserTypes.includes(userType)) {
      return NextResponse.json(
        { message: "Invalid user type selected" },
        { status: 400 }
      );
    }

    const formattedEmail = email.toLowerCase().trim();
    if (!isValidEmail(formattedEmail)) {
      return NextResponse.json(
        { message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json(
        { message: passwordError },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({
      email: formattedEmail,
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email: formattedEmail,
      password: hashedPassword,
      userType,
    });

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return NextResponse.json(
        { message: "JWT secret is not configured" },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      { id: newUser._id.toString(), email: newUser.email },
      secret,
      { expiresIn: "1d" }
    );

    const res = NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
