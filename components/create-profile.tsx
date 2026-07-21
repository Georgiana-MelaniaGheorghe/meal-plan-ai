

"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

type ApiResponse = {
  message: string;
  error?: string;
};

export default function CreateProfileOnSignIn() {
  const { isLoaded, isSignedIn } = useUser();


  const { mutate, isPending } = useMutation<ApiResponse, Error>({
    mutationFn: async () => {
      const res = await fetch("/api/create-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      return data as ApiResponse;
    },
    onSuccess: (data) => {
      console.log(data.message);
      toast.success("Profile synchronized successfully.");
    },
    onError: (error) => {
      console.error("Error creating profile:", error);
      
    },
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && !isPending) {
   
      mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  return null; 
}