const getHeaderForum = async () => {
    const res  = await fetch(`/api/forum/header-forum`);
    if (!res.ok) throw new Error('Lỗi khi fetch dữ liệu');
  return res.json();
}
export default getHeaderForum;