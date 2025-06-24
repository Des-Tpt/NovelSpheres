'use client'
import getGenres from "@/action/getGenres";
import getNovelByFilter from "@/action/getNovelByFilter";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import getImage from "@/action/getImage";
import INovelWithPopulate from "@/type/INovelWithPopulate";

type Genre = {
    _id: string;
    name: string;
}


const BookFilter = () => {
    //Lấy thể loại novel.
    const { data: genres, isLoading: isGenresLoading, error: genresError } = useQuery<Genre[] | null>({
        queryKey: ['genres'],
        queryFn: getGenres,
        staleTime: 1000 * 60 * 5,
        });

    const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
    const [novels, setNovels] = useState<INovelWithPopulate[]>([]);
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    const [sort, setSort] = useState<string>("createdAt");

    useEffect(() => {
        if (novels) {
            novels.map(async (novel) => {
                const publicId = novel.coverImage?.publicId;
                const format = novel.coverImage?.format ?? 'jpg';
                    if (publicId && !imageUrls[publicId]) {
                        const res = await getImage(publicId, format);
                        if (res) {
                            setImageUrls((prev) => ({ ...prev, [publicId]: res }));
                        }
                    }
            });
        }
    }, [novels]);

    const handleOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        const id = e.currentTarget.id;
        if (id !== sort) {
        setSort(id);}
    };

    //Lấy novel theo thể loại.
    useEffect (() => {
        const fetchData = async () => {
            try {
                const data = await getNovelByFilter(selectedGenres, sort);
                if (data) setNovels(data);
                    console.log("Data structure:", JSON.stringify(data))
                    console.log("Thông tin data:", data);
                    console.log("Thông tin novel:", novels);

            } catch (err) {
                console.log(err);
            }
        }
        fetchData();
    }, [selectedGenres, sort])

    const toggleGenres = (genre: Genre) => {
        setSelectedGenres ((prev) =>
            prev.find((g) => g._id == genre._id) ? prev.filter((g) => g._id !== genre._id) : [...prev, genre]
        )
    }
    
    if (isGenresLoading) return (<div className="flex flex-col pt-7 bg-gradient-to-r from-black from-20% via-gray-950 via-75% to-black min-h-screen"></div>);
    if (genresError instanceof Error) return <p>Lỗi: {genresError.message}</p>;
    if (!genres || genres.length === 0) return <p>Không có dữ liệu</p>;

    return (
    <div className="flex flex-wrap justify-center gap-1 bg-gradient-to-r from-black from-20% via-gray-950 via-75% to-black pt-[5%] pb-[5%]">
        <div className="w-full md:mx-[14%] mx-10 p-4 rounded-2xl group hover:shadow hover:shadow-white hover:border-white transition-all duration-300">
            <h1 className="text-white mb-2 block text-3xl">Lọc theo thể loại</h1>
            {selectedGenres.length > 0 &&  
                <div className="flex gap-1.5 font-inter py-2.5 flex-wrap items-center pb-5">Đã chọn:
                    {   
                        selectedGenres.map(genre => (
                            <div key={genre._id} className="flex rounded-[3rem] px-3 pl-4 py-0.5 items-center" style={{ backgroundColor: "#242424" }}>
                                <button className='flex items-center cursor-pointer' onClick={() => toggleGenres(genre)}>{genre.name} <XMarkIcon className="w-3 h-3 ml-1"/></button>
                            </div>
                        ))
                    }
                    <button className='flex items-center cursor-pointer pl-3.5' onClick={() => setSelectedGenres([])}>Xóa hết tất cả</button>
                </div>
            }
            <div className="flex font-bold flex-wrap justify-center gap-3 sm:grid sm:grid-cols-5 sm:gap md:grid md:grid-cols-8 md:gap-2 ">
                {genres.map((genre) => (
                    <button key={genre._id} 
                    className={`cursor-pointer border border-white text-center text-[0.9rem] font-sans text-white hover:bg-white hover:text-black transition-all duration-300 rounded-[8px] py-1 w-[7rem] md:w-auto
                    ${selectedGenres.find((g) => g._id === genre._id)
                                    ? 'bg-gray-700 text-black'
                                    : 'hover:bg-white hover:text-black'}
                    `}
                    onClick={() => toggleGenres(genre)}
                    >{genre.name}
                    </button>
                ))}
            </div>
            <div className="flex items-center">
                <button id="views" onClick={handleOnClick} className={`px-4 py-2 rounded-full text-sm font-medium transition ${sort === "views" ? "bg-amber-500 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >Phổ biến</button>
                <button id="updatedAt" onClick={handleOnClick} className={`px-4 py-2 rounded-full text-sm font-medium transition ${sort === "updatedAt" ? "bg-amber-500 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                Mới</button>
                <button id="title" onClick={handleOnClick} className={`px-4 py-2 rounded-full text-sm font-medium transition ${sort === "title" ? "bg-amber-500 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`} >
                A - Z</button>
            </div>
        </div>
            <div className="flex">
            {novels.map(novel => (
                    <div key={novel._id.toString()}>
                        <img
                            src={novel.coverImage?.publicId 
                                ? imageUrls[novel.coverImage.publicId] 
                                : 'https://res.cloudinary.com/dr29oyoqx/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png'
                            }
                            alt={novel.title}
                            className="w-48 h-62 object-cover"
                        />
                    </div>
                    ))
                }
            </div>
    </div>
    )
}

export default BookFilter;
