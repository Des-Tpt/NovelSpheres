const handleCategory = (category: String) => {
    switch(category) {
        case 'general' : return 'Thảo luận chung';
        case 'reviews' : return 'Đánh giá & Nhận xét'
        case 'ask-author' : return 'Hỏi đáp tác giả'
        case 'writing' : return 'Sáng tác & Viết lách'
        case 'recommendations' : return 'Gợi ý & Đề xuất'
        case 'support' : return 'Hỗ trợ & Trợ giúp'
    }
  }

export default handleCategory;