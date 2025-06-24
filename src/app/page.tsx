import Banner from "@/components/home/Banner";
import BookFilter from "@/components/home/BookFilter";
import FeatureBook from "@/components/home/FeatureBook";

export default function Home() {
    return (
      <div>
        <Banner/>
        <FeatureBook />
        <BookFilter />
      </div>
    )
  }