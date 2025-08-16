'use client'
import React, { useState } from 'react';
import { User, Book, Heart, Eye, Users, Calendar, Globe, MessageCircle, Edit3, Settings, Star, MapPin, Link as LinkIcon, History, Bookmark } from 'lucide-react';

// Types based on your actual schemas
interface IUser {
  _id: string;
  username: string;
  email: string;
  role: 'reader' | 'admin' | 'writer';
  profile?: {
    bio?: string;
    avatar?: {
      publicId: string;
      format: string;
    };
  };
  createdAt: Date;
}

interface IProfile {
  userId: string;
  bio: string;
  socials: {
    facebook?: string;
    twitter?: string;
    discord?: string;
    website?: string;
  };
  stats: {
    followers: number;
    following: number;
    totalViews: number;
    totalNovels: number;
  };
  favorites: string[]; // Array of Likes ObjectIds
  novelsPosted: string[]; // Array of Novel ObjectIds
  createdAt: Date;
  updatedAt: Date;
}

interface INovel {
  _id: string;
  title: string;
  authorId?: { username: string };
  description: string;
  coverImage?: {
    publicId?: string;
    format?: string;
  };
  genresId?: Array<{ _id: string; name: string }>;
  status: 'Ongoing' | 'Completed' | 'Hiatus';
  views: number;
  likes: number;
  rating: number;
  ratingsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ILike {
  _id: string;
  userId: string;
  novelId: INovel;
  createdAt: Date;
}

interface IReadingHistory {
  _id: string;
  userId: string;
  novelId: INovel;
  chapterId: string;
  lastReadAt: Date;
}

const CleanProfilePage: React.FC = () => {
  // Mock data based on your actual schemas
  const [userData] = useState<IUser>({
    _id: "507f1f77bcf86cd799439011",
    username: "BookLover2024",
    email: "booklover@email.com",
    role: "reader",
    profile: {
      bio: "Yêu thích đọc truyện tu tiên và fantasy.",
      avatar: {
        publicId: "avatar_123",
        format: "jpg"
      }
    },
    createdAt: new Date("2023-03-15")
  });

  const [profileData, setProfileData] = useState<IProfile>({
    userId: "507f1f77bcf86cd799439011",
    bio: "Yêu thích đọc truyện tu tiên và fantasy. Đang theo dõi hơn 20 tác phẩm hay.",
    socials: {
      website: "myblog.com",
      discord: "BookLover#1234"
    },
    stats: {
      followers: 18,
      following: 67,
      totalViews: 2450,
      totalNovels: 8
    },
    favorites: ["like1", "like2", "like3"], // Likes ObjectIds
    novelsPosted: ["novel1", "novel2"], // Novel ObjectIds
    createdAt: new Date("2023-03-15"),
    updatedAt: new Date("2024-08-10")
  });

  // Mock novels posted by user
  const [userNovels] = useState<INovel[]>([
    {
      _id: "novel1",
      title: "Tu Tiên Đế Tôn",
      authorId: { username: "BookLover2024" },
      description: "Một câu chuyện về chàng kiếm sĩ trẻ tuổi trong thế giới tu tiên đầy nguy hiểm...",
      coverImage: { publicId: "novel1", format: "jpg" },
      genresId: [{ _id: "1", name: "Tu tiên" }, { _id: "2", name: "Huyền huyễn" }],
      status: "Ongoing",
      views: 15420,
      likes: 892,
      rating: 4.5,
      ratingsCount: 156,
      createdAt: new Date("2023-05-20"),
      updatedAt: new Date("2024-08-15")
    },
    {
      _id: "novel2",
      title: "Ma Đế Truyền Thuyết", 
      authorId: { username: "BookLover2024" },
      description: "Cuộc chiến cuối cùng giữa thiện và ác đã bắt đầu...",
      coverImage: { publicId: "novel2", format: "jpg" },
      genresId: [{ _id: "3", name: "Ma pháp" }, { _id: "4", name: "Phiêu lưu" }],
      status: "Completed",
      views: 23100,
      likes: 1205,
      rating: 4.8,
      ratingsCount: 89,
      createdAt: new Date("2023-03-10"),
      updatedAt: new Date("2024-08-10")
    }
  ]);

  // Mock favorite novels (from Likes)
  const [favoriteLikes] = useState<ILike[]>([
    {
      _id: "like1",
      userId: "507f1f77bcf86cd799439011",
      novelId: {
        _id: "novel3",
        title: "Thiên Long Bát Bộ",
        authorId: { username: "KimDung" },
        description: "Tác phẩm kinh điển võ hiệp...",
        status: "Completed",
        views: 89000,
        likes: 3420,
        rating: 4.9,
        ratingsCount: 567,
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2024-08-01")
      },
      createdAt: new Date("2024-07-15")
    },
    {
      _id: "like2",
      userId: "507f1f77bcf86cd799439011",
      novelId: {
        _id: "novel4",
        title: "Dấu Phá Thương Khung",
        authorId: { username: "ToanThu" },
        description: "Cuộc phiêu lưu trong thế giới đấu khí...",
        status: "Ongoing",
        views: 67500,
        likes: 2890,
        rating: 4.6,
        ratingsCount: 234,
        createdAt: new Date("2023-08-01"),
        updatedAt: new Date("2024-08-14")
      },
      createdAt: new Date("2024-08-01")
    }
  ]);

  // Mock reading history
  const [readingHistory] = useState<IReadingHistory[]>([
    {
      _id: "hist1",
      userId: "507f1f77bcf86cd799439011",
      novelId: {
        _id: "novel3",
        title: "Thiên Long Bát Bộ",
        authorId: { username: "KimDung" },
        description: "Đang đọc chương 245...",
        status: "Ongoing",
        views: 89000,
        likes: 3420,
        rating: 4.9,
        ratingsCount: 567,
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2024-08-01")
      },
      chapterId: "chapter245",
      lastReadAt: new Date("2024-08-15T14:30:00")
    }
  ]);

  const [activeTab, setActiveTab] = useState<'novels' | 'favorites' | 'history'>('novels');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState(profileData.bio);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Vừa xong';
    if (hours < 24) return `${hours} giờ trước`;
    if (days === 1) return 'Hôm qua';
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Ongoing': return 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-500/30';
      case 'Completed': return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30';
      case 'Hiatus': return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/30';
      default: return 'bg-gray-700/50 text-gray-400 border border-gray-600/30';
    }
  };

  const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, '');
  };

  const handleBioSave = () => {
    setProfileData(prev => ({ ...prev, bio: editedBio }));
    setIsEditingBio(false);
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-6 sm:p-8 mb-6">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            
            {/* Avatar & Basic Info */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-2xl">
                  {userData.profile?.avatar ? (
                    <img src="#" alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    userData.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 border-4 border-gray-800 rounded-xl flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">{userData.username}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    userData.role === 'writer' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    userData.role === 'admin' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {userData.role === 'writer' ? 'Tác giả' : userData.role === 'admin' ? 'Quản trị' : 'Độc giả'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Tham gia {formatDate(userData.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio & Social */}
            <div className="flex-1 lg:max-w-md">
              {isEditingBio ? (
                <div className="space-y-3">
                  <textarea
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleBioSave}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 font-medium"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingBio(false);
                        setEditedBio(profileData.bio);
                      }}
                      className="px-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="group cursor-pointer" onClick={() => setIsEditingBio(true)}>
                    <p className="text-gray-300 leading-relaxed text-sm mb-2">
                      {profileData.bio}
                    </p>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit3 className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500">Chỉnh sửa bio</span>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="space-y-2 text-sm text-gray-400">
                    {profileData.socials.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 hover:text-blue-300 cursor-pointer">
                          {profileData.socials.website}
                        </span>
                      </div>
                    )}
                    {profileData.socials.discord && (
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-indigo-400" />
                        <span className="text-gray-300">{profileData.socials.discord}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{profileData.stats.totalNovels}</div>
              <div className="text-sm text-gray-400">Truyện đăng</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{formatNumber(profileData.stats.totalViews)}</div>
              <div className="text-sm text-gray-400">Lượt xem</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{profileData.stats.followers}</div>
              <div className="text-sm text-gray-400">Theo dõi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{profileData.stats.following}</div>
              <div className="text-sm text-gray-400">Đang theo</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-2 border border-gray-700/50">
          {[
            { key: 'novels', label: `Truyện đăng (${userNovels.length})`, icon: Book },
            { key: 'favorites', label: `Yêu thích (${favoriteLikes.length})`, icon: Heart },
            { key: 'history', label: `Lịch sử đọc`, icon: History }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === key
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:block text-sm">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-6">
          
          {/* Novels Posted Tab */}
          {activeTab === 'novels' && (
            <div>
              {userNovels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userNovels.map((novel) => (
                    <div
                      key={novel._id}
                      className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group overflow-hidden"
                    >
                      {/* Cover */}
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <Book className="w-16 h-16 text-gray-400" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute top-3 right-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm ${getStatusColor(novel.status)}`}>
                            {novel.status}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-white text-xs font-semibold">{novel.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors mb-2 line-clamp-2">
                          {novel.title}
                        </h3>
                        
                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                          {stripHtml(novel.description)}
                        </p>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {novel.genresId?.slice(0, 2).map((genre) => (
                            <span
                              key={genre._id}
                              className="px-2.5 py-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-medium"
                            >
                              {genre.name}
                            </span>
                          ))}
                        </div>

                        {/* Stats */}
                        <div className="pt-3 border-t border-gray-800/50">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-emerald-400">
                                <Eye className="w-3 h-3" />
                                <span>{formatNumber(novel.views)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-rose-400">
                                <Heart className="w-3 h-3" />
                                <span>{formatNumber(novel.likes)}</span>
                              </div>
                            </div>
                            <div className="text-gray-500">
                              {formatDate(novel.updatedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Book className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Chưa đăng truyện nào</p>
                </div>
              )}
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div>
              {favoriteLikes.length > 0 ? (
                <div className="space-y-4">
                  {favoriteLikes.map((like) => (
                    <div key={like._id} className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl hover:bg-gray-800/50 transition-colors">
                      <div className="w-16 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Book className="w-8 h-8 text-gray-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white hover:text-blue-400 transition-colors cursor-pointer mb-1">
                          {like.novelId.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-2">bởi {like.novelId.authorId?.username}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {formatNumber(like.novelId.views)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {formatNumber(like.novelId.likes)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            {like.novelId.rating.toFixed(1)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(like.novelId.status)}`}>
                          {like.novelId.status}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Thích {formatDate(like.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Chưa có truyện yêu thích</p>
                </div>
              )}
            </div>
          )}

          {/* Reading History Tab */}
          {activeTab === 'history' && (
            <div>
              {readingHistory.length > 0 ? (
                <div className="space-y-4">
                  {readingHistory.map((history) => (
                    <div key={history._id} className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl hover:bg-gray-800/50 transition-colors">
                      <div className="w-16 h-20 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Book className="w-8 h-8 text-gray-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white hover:text-blue-400 transition-colors cursor-pointer mb-1">
                          {history.novelId.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-2">bởi {history.novelId.authorId?.username}</p>
                        <p className="text-sm text-cyan-400">Đọc đến chương {history.chapterId}</p>
                      </div>

                      <div className="text-right text-sm text-gray-500">
                        {formatDate(history.lastReadAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Chưa có lịch sử đọc</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CleanProfilePage;