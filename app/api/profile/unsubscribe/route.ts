/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";

export async function POST() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const profile = await prisma.profile.findUnique({
      where: { userId: clerkUser.id },
    });

    if (!profile?.stripeSubscriptionId) {
      throw new Error("No active subscription found.");
    }

    const subscriptionId = profile.stripeSubscriptionId;


    const canceledSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: true, 
      }
    );

    await prisma.profile.update({
      where: { userId: clerkUser.id },
      data: {
        subscriptionTier: null,
        stripeSubscriptionId: null,
        subscriptionActive: false,
      },
    });

    return NextResponse.json({ subscription: canceledSubscription });
  } catch (error: any) {
    console.error("Error unsubscribing:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unsubscribe." },
      { status: 500 }
    );
  }
}