const getAllPost = async () => {
    const res  = await fetch(`/api/forum/all-post`);
    if (!res.ok) throw new Error('Lỗi khi fetch dữ liệu');
  return res.json();
}

export default getAllPost;