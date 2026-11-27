import Link from "next/link";
import Image from "next/image";
import { ChartColumn, GraduationCap, LogOut } from "lucide-react";
import { auth, signIn, signOut } from "@/lib/auth";
import { NavLinks } from "@/components/NavLinks";

export async function Nav() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-1 overflow-x-auto whitespace-nowrap px-4 sm:gap-2 sm:px-6">
        <Link href="/" className="mr-2 flex shrink-0 items-center gap-2 font-semibold tracking-tight sm:mr-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-white">
            <GraduationCap className="h-4 w-4" aria-hidden />
          </span>
          <span className="hidden sm:inline">SuperTutor</span>
        </Link>
        <nav className="flex items-center gap-0.5">
          <NavLinks />
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                aria-label="Progress"
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-ink"
              >
                <ChartColumn className="h-4 w-4 md:hidden" aria-hidden />
                <span className="hidden md:inline">Progress</span>
              </Link>
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt=""
                  width={28}
                  height={28}
                  className="hidden rounded-full border border-line sm:block"
                />
              )}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  aria-label="Sign out"
                  className="flex items-center rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-ink"
                >
                  <LogOut className="h-4 w-4 md:hidden" aria-hidden />
                  <span className="hidden md:inline">Sign out</span>
                </button>
              </form>
            </>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("google");
              }}
            >
              <button className="btn-primary px-3.5 py-1.5 text-sm">Sign in</button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
