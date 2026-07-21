/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";
import { getPriceIdFromType } from "@/lib/plans";

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newPlan } = await request.json();
    if (!newPlan) {
      return NextResponse.json(
        { error: "New plan is required." },
        { status: 400 }
      );
    }

  
    const profile = await prisma.profile.findUnique({
      where: { userId: clerkUser.id },
    });
    if (!profile?.stripeSubscriptionId) {
      throw new Error("No active subscription found.");
    }

    const subscriptionId = profile.stripeSubscriptionId;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionItemId = subscription.items.data[0]?.id;
    if (!subscriptionItemId) {
      throw new Error("Subscription item not found.");
    }

    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: false,
        items: [
          {
            id: subscriptionItemId,
            price: getPriceIdFromType(newPlan),
          },
        ],
        proration_behavior: "create_prorations",
      }
    );


    await prisma.profile.update({
      where: { userId: clerkUser.id },
      data: {
        subscriptionTier: newPlan,
        stripeSubscriptionId: updatedSubscription.id,
        subscriptionActive: true,
      },
    });

    return NextResponse.json({ subscription: updatedSubscription });
  } catch (error: any) {
    console.error("Error changing subscription plan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to change subscription plan." },
      { status: 500 }
    );
  }
}