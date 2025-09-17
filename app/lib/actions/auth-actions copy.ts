'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';

/**
 * Logs in a user with the provided credentials.
 * @param data - The login form data, containing email and password.
 * @returns An object with an error message if login fails, otherwise null.
 */
export async function login({ email, password }: LoginFormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Registers a new user with the provided credentials.
 * @param data - The registration form data, containing name, email, and password.
 * @returns An object with an error message if registration fails, otherwise null.
 */
export async function register({ name, email, password }: RegisterFormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Logs out the currently authenticated user.
 * @returns An object with an error message if logout fails, otherwise null.
 */
export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Retrieves the currently authenticated user.
 * @returns The user object if authenticated, otherwise null.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Retrieves the current session.
 * @returns The session object if a session exists, otherwise null.
 */
export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}
