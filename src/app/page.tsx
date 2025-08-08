import Banner from "@/components/home/Banner";
import BookFilter from "@/components/home/BookFilter";
import FeatureBook from "@/components/home/FeatureBook";

export default function Home() {
    return (
      <div className="md:pt-15">
        <title>NovelSpheres</title>
        <Banner/>
        <FeatureBook />
        <BookFilter />
      </div>
    )
  }