import Banner from "@/components/home/Banner";
import BookFilter from "@/components/home/BookFilter";
import FeatureBook from "@/components/home/FeatureBook";

export default function Home() {
    return (
      <div className="md:pt-15 w1080:px-[15%] bg-black">
        <title>NovelSpheres</title>
        <Banner/>
        <FeatureBook />
        <BookFilter />
      </div>
    )
  }