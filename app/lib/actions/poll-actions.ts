"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// CREATE POLL
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Enhanced validation
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return { error: "Please provide a valid question." };
  }
  
  if (question.trim().length > 200) {
    return { error: "Question must be 200 characters or less." };
  }

  if (!Array.isArray(options) || options.length < 2 || options.length > 10) {
    return { error: "Please provide between 2 and 10 options." };
  }

  // Validate each option
  for (let i = 0; i < options.length; i++) {
    if (typeof options[i] !== 'string' || options[i].trim().length === 0) {
      return { error: `Option ${i + 1} cannot be empty.` };
    }
    if (options[i].trim().length > 100) {
      return { error: `Option ${i + 1} must be 100 characters or less.` };
    }
  }

  // Sanitize inputs (trim whitespace)
  const sanitizedQuestion = question.trim();
  const sanitizedOptions = options.map(option => option.trim());

  // Check for duplicate options
  const uniqueOptions = new Set(sanitizedOptions);
  if (uniqueOptions.size !== sanitizedOptions.length) {
    return { error: "All options must be unique." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question: sanitizedQuestion,
      options: sanitizedOptions,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/polls");
  return { error: null };
}

// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  
  // Validate inputs
  if (!pollId || typeof pollId !== 'string') {
    return { error: 'Invalid poll ID.' };
  }
  
  if (typeof optionIndex !== 'number' || optionIndex < 0) {
    return { error: 'Invalid option selected.' };
  }

  // Verify poll exists and get options length
  const { data: pollData, error: pollError } = await supabase
    .from("polls")
    .select("options")
    .eq("id", pollId)
    .single();

  if (pollError || !pollData) {
    return { error: 'Poll not found.' };
  }

  // Validate option index is within bounds
  if (optionIndex >= pollData.options.length) {
    return { error: 'Invalid option selected.' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user already voted
  if (user) {
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      return { error: 'You have already voted on this poll.' };
    }
  }

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null,
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  return { error: null };
}

// DELETE POLL
export async function deletePoll(id: string) {
  const supabase = await createClient();
  
  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to delete a poll." };
  }

  // Only allow deleting polls owned by the user OR if user is admin
  // First check if the poll exists and get owner info
  const { data: pollData, error: pollError } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", id)
    .single();

  if (pollError) {
    return { error: "Poll not found." };
  }

  // Check if user owns the poll or is admin (checking if email contains admin for demo)
  // In production, you should have a proper admin role system
  const isAdmin = user.email?.includes('admin') ?? false;
  const isOwner = pollData.user_id === user.id;

  if (!isOwner && !isAdmin) {
    return { error: "You are not authorized to delete this poll." };
  }

  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/polls");
  return { error: null };
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  // Validate poll ID
  if (!pollId || typeof pollId !== 'string') {
    return { error: "Invalid poll ID." };
  }

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Enhanced validation (same as create poll)
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return { error: "Please provide a valid question." };
  }
  
  if (question.trim().length > 200) {
    return { error: "Question must be 200 characters or less." };
  }

  if (!Array.isArray(options) || options.length < 2 || options.length > 10) {
    return { error: "Please provide between 2 and 10 options." };
  }

  // Validate each option
  for (let i = 0; i < options.length; i++) {
    if (typeof options[i] !== 'string' || options[i].trim().length === 0) {
      return { error: `Option ${i + 1} cannot be empty.` };
    }
    if (options[i].trim().length > 100) {
      return { error: `Option ${i + 1} must be 100 characters or less.` };
    }
  }

  // Sanitize inputs
  const sanitizedQuestion = question.trim();
  const sanitizedOptions = options.map(option => option.trim());

  // Check for duplicate options
  const uniqueOptions = new Set(sanitizedOptions);
  if (uniqueOptions.size !== sanitizedOptions.length) {
    return { error: "All options must be unique." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Only allow updating polls owned by the user
  const { error } = await supabase
    .from("polls")
    .update({ question: sanitizedQuestion, options: sanitizedOptions })
    .eq("id", pollId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
