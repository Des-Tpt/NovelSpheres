const handleStatus = (en: string) => {
     switch(en) {
        case 'Completed' : return 'Hoàn thành';
        case 'Ongoing' : return 'Đang tiến hành'
        case 'Hiatus' : return 'Tạm ngưng'
    }
}

export default handleStatus