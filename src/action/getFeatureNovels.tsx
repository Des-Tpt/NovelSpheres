const getFeatureNovels = async () => {
    const res  = await fetch(`/api/feature-novels`);
    if (!res.ok) throw new Error('Lỗi khi fetch dữ liệu');
  return res.json();
}

export default getFeatureNovels;