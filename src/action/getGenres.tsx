const getGenres = async () => {
    const res  = await fetch(`/api/genres`);
    if (!res.ok) throw new Error('Lỗi khi fetch dữ liệu');
  return res.json();
}

export default getGenres;