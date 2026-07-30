import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: NextRequest) {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "MISSING";
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "MISSING";

  const cookieLog: string[] = [];

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name }) => cookieLog.push(`SET:${name}`));
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: "admin@codekids.test",
    password: "TestAdmin123!",
  });

  const { data: { user: me } } = await supabase.auth.getUser();

  return NextResponse.json({
    url:        url.slice(0, 50),
    key_prefix: key.slice(0, 25),
    login_user: data?.user?.email ?? null,
    login_err:  error?.message ?? null,
    getUser:    me?.email ?? null,
    cookies_set: cookieLog,
  });
}
