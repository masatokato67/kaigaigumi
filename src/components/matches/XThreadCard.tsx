"use client";

import { useState } from "react";
import { XThread } from "@/lib/types";

interface XThreadCardProps {
  thread: XThread;
}

function formatNumber(num: number): string {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export default function XThreadCard({ thread }: XThreadCardProps) {
  const [showReplies, setShowReplies] = useState(thread.replies.length > 0);

  const isManual = thread.isManual === true;

  return (
    <div className="rounded-xl border overflow-hidden transition-colors border-gray-800 hover:border-gray-700">
      {/* Main Thread */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-gray-600 to-gray-700">
            <span className="text-sm font-bold text-white">
              {thread.username.replace("@", "").charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-1.5 mb-1">
              {isManual && thread.postUrl ? (
                <a
                  href={thread.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white text-sm truncate hover:text-blue-400 transition-colors"
                >
                  {thread.username}
                </a>
              ) : (
                <span className="font-semibold text-white text-sm truncate">
                  {thread.username}
                </span>
              )}
              {thread.verified && (
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                </svg>
              )}
              <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-gray-800 rounded">
                {thread.languageCode}
              </span>
              {isManual && thread.postUrl && (
                <a
                  href={thread.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-400 transition-colors ml-auto"
                  title="Xで見る"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
            </div>

            {/* Original Text */}
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line mb-2">
              {thread.originalText}
            </p>

            {/* Translation (hide for JA or empty/placeholder) */}
            {thread.translatedText && thread.translatedText !== "（翻訳未生成）" && thread.languageCode !== "JA" && (
              <div className="bg-gray-800/40 rounded-lg p-3 border-l-2 border-red-500/60 mb-3">
                <p className="text-white text-sm leading-relaxed">
                  {thread.translatedText}
                </p>
              </div>
            )}

            {/* Metrics */}
            <div className="flex items-center gap-5 text-gray-500">
              {/* Replies toggle */}
              {thread.replies.length > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="flex items-center gap-1.5 text-xs hover:text-blue-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{thread.replies.length}</span>
                </button>
              )}
              <div className="flex items-center gap-1.5 text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{formatNumber(thread.retweets)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{formatNumber(thread.likes)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Replies (collapsible) */}
      {showReplies && thread.replies.length > 0 && (
        <div className="border-t border-gray-800 bg-gray-900/30">
          {thread.replies.map((reply, index) => (
            <div
              key={reply.id}
              className={`px-4 py-3 ${index !== thread.replies.length - 1 ? "border-b border-gray-800/50" : ""}`}
            >
              <div className="flex items-start gap-3 pl-6">
                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gray-300">
                    {reply.username.replace("@", "").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-medium text-gray-400 text-xs">
                      {reply.username}
                    </span>
                    <span className="text-[10px] text-gray-600 px-1 py-0.5 bg-gray-800/60 rounded">
                      {reply.languageCode}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed mb-1">
                    {reply.originalText}
                  </p>
                  {reply.translatedText && reply.translatedText !== "（翻訳未生成）" && reply.languageCode !== "JA" && (
                    <p className="text-gray-300 text-xs leading-relaxed mb-1">
                      {reply.translatedText}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-gray-600 text-[10px]">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{formatNumber(reply.likes)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
