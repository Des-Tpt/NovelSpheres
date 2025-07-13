import Banner from "@/components/home/Banner";
import BookFilter from "@/components/home/BookFilter";
import FeatureBook from "@/components/home/FeatureBook";

export default function Home() {
    return (
      <div className="pt-15">
        <Banner/>
        <FeatureBook />
        <BookFilter />
      </div>
    )
  }