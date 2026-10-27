export const loginAPI = async (username, password) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const users = [
    {
      username: '61131274',
      password: 'trantin123',
      name: 'Trần Tín',
      role: 'student',
      avatar: 'https://ui-avatars.com/api/?name=Tran+Tin&background=random'
    },
    {
      username: 'gv001',
      password: '123456',
      name: 'Giảng Viên A',
      role: 'teacher',
      avatar: 'https://ui-avatars.com/api/?name=Giang+Vien&background=random'
    },
    {
      username: 'admin',
      password: 'admin123',
      name: 'Administrator',
      role: 'admin',
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=random'
    }
  ];

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    // Return user without password
    const { password, ...userInfo } = user;
    return { success: true, user: userInfo };
  }

  return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng' };
};
