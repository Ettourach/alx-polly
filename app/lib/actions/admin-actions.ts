"use server";

import { createClient } from "@/lib/supabase/server";

// Check if user is admin
export async function checkAdminAccess() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { isAdmin: false, error: userError.message };
  }
  if (!user) {
    return { isAdmin: false, error: "You must be logged in." };
  }

  // Simple admin check - in production, you should have a proper admin role system
  // This is just for demonstration purposes
  const isAdmin = user.email?.includes('admin') ?? false;
  
  if (!isAdmin) {
    return { isAdmin: false, error: "You are not authorized to access this area." };
  }

  return { isAdmin: true, error: null };
}

// Get all polls (admin only)
export async function getAllPolls() {
  const adminCheck = await checkAdminAccess();
  if (!adminCheck.isAdmin) {
    return { polls: [], error: adminCheck.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}