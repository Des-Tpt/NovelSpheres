const getStatusColor = (status: string) => {
    switch (status) {
        case 'Ongoing': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
        case 'Completed': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
        case 'Hiatus': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
};

export default getStatusColor;