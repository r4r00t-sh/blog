"use client";

import { useMemo, useState } from "react";
import type { PostMeta } from "@/lib/post-types";
import { SearchDialog } from "@/components/search-dialog";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

type HomeClientProps = {
  posts: PostMeta[];
};

export function HomeClient({ posts }: HomeClientProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const postSlugs = useMemo(() => posts.map((p) => p.slug), [posts]);

  return (
    <>
      <KeyboardShortcuts onSearchOpen={() => setSearchOpen(true)} postSlugs={postSlugs} />
      <SearchDialog posts={posts} isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
