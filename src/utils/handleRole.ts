const handleRole = (role: String) => {
    switch(role) {
      case 'admin' : return 'Quản trị viên';
      case 'writer' : return 'Tác giả'
      case 'reader' : return 'Độc giả'
      default: return 'Thành viên'
    }
}

export default handleRole;