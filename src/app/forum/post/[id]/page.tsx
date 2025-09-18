import PostDetail from "@/components/post-detail/PostDetail";

export default function PostPage() {
  return (
  <div className="min-h-screen pt-1 md:pt-15 md:px-[15%] bg-black md:bg-gradient-to-r md:from-black md:from-20% md:via-gray-950 md:via-75% md:to-black">
    <title>Bài đăng...</title>
    <PostDetail />
  </div>
  );
}