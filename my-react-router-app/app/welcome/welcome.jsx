"use client"; // Only for Next.js

import Questions from "./questions";

export function Welcome() {
  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <header className="flex flex-col items-center gap-9">
          <div className="w-[500px] max-w-[100vw] p-4"></div>
        </header>
        <div className="max-w-[300px] w-full space-y-6 px-4">
          <nav className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
            <p className="leading-6 text-gray-700 dark:text-gray-200 text-center">
              What&apos;s next?
            </p>
            <ul>
              {resources.map(({ audio, button }) => (
                <li>
                  <Questions></Questions>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </main>
  );
}

function log() {
  console.log("Clicked");
}

const resources = [
  {
    audio: <audio src="/audio/myfile.mp3"></audio>,
  },
];
