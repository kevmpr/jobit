/// <reference types="astro/client" />
import type { Session, SupabaseClient } from '@supabase/supabase-js';

declare namespace App {
  interface Locals {
    session: Session | null;
    supabase: SupabaseClient;
  }
}
