# 📚 HƯỚNG DẪN SỬ DỤNG GIT

## 🎯 TỔNG QUAN

Git là hệ thống quản lý phiên bản (version control) giúp:
- ✅ Lưu trữ lịch sử thay đổi code
- ✅ Làm việc nhóm dễ dàng
- ✅ Khôi phục code khi có lỗi
- ✅ Quản lý nhiều phiên bản

---

## 🚀 CÀI ĐẶT GIT

### Windows
1. Tải Git từ: https://git-scm.com/download/win
2. Cài đặt với các tùy chọn mặc định
3. Kiểm tra: Mở Git Bash hoặc PowerShell và chạy:
```bash
git --version
```

### Cấu hình lần đầu
```bash
# Cấu hình tên
git config --global user.name "Tên của bạn"

# Cấu hình email
git config --global user.email "email@example.com"

# Kiểm tra cấu hình
git config --list
```

---

## 📋 CÁC LỆNH CƠ BẢN

### 1. Khởi tạo Repository (Lần đầu)

```bash
# Tạo repository mới trong thư mục hiện tại
git init

# Hoặc clone repository từ GitHub/GitLab
git clone https://github.com/username/repository.git
```

### 2. Kiểm tra trạng thái

```bash
# Xem trạng thái các file đã thay đổi
git status

# Xem thay đổi chi tiết
git diff

# Xem lịch sử commit
git log

# Xem lịch sử ngắn gọn
git log --oneline
```

### 3. Thêm và commit

```bash
# Thêm file cụ thể vào staging area
git add ten_file.js

# Thêm tất cả file đã thay đổi
git add .

# Thêm tất cả file (bao gồm cả file đã xóa)
git add -A

# Commit với message
git commit -m "Mô tả thay đổi"

# Commit với message dài
git commit -m "Tiêu đề" -m "Mô tả chi tiết"
```

**Ví dụ:**
```bash
git add .
git commit -m "Thêm module Quản lý hồ sơ cá nhân"
```

### 4. Xem lịch sử

```bash
# Xem tất cả commit
git log

# Xem commit ngắn gọn (1 dòng)
git log --oneline

# Xem commit với graph
git log --oneline --graph

# Xem thay đổi của commit cụ thể
git show <commit-hash>
```

### 5. Quay lại phiên bản cũ

```bash
# Xem danh sách commit
git log --oneline

# Quay lại commit cụ thể (giữ thay đổi)
git checkout <commit-hash>

# Quay lại commit cụ thể (xóa thay đổi)
git reset --hard <commit-hash>

# Quay lại commit trước đó
git reset --hard HEAD~1

# Quay lại branch chính
git checkout main
# hoặc
git checkout master
```

---

## 🌿 LÀM VIỆC VỚI BRANCH

### Tạo và chuyển branch

```bash
# Xem tất cả branch
git branch

# Tạo branch mới
git branch ten-branch

# Chuyển sang branch
git checkout ten-branch

# Tạo và chuyển sang branch mới (1 lệnh)
git checkout -b ten-branch

# Xóa branch
git branch -d ten-branch

# Xóa branch (force)
git branch -D ten-branch
```

### Merge branch

```bash
# Chuyển về branch chính
git checkout main

# Merge branch vào branch hiện tại
git merge ten-branch
```

---

## 🔄 LÀM VIỆC VỚI REMOTE (GitHub/GitLab)

### Kết nối với remote

```bash
# Xem remote hiện tại
git remote -v

# Thêm remote
git remote add origin https://github.com/username/repository.git

# Đổi tên remote
git remote rename origin new-name

# Xóa remote
git remote remove origin
```

### Push và Pull

```bash
# Push code lên remote (lần đầu)
git push -u origin main

# Push code lên remote (các lần sau)
git push

# Pull code từ remote
git pull

# Pull code từ remote (force)
git pull --rebase
```

### Clone repository

```bash
# Clone repository
git clone https://github.com/username/repository.git

# Clone vào thư mục cụ thể
git clone https://github.com/username/repository.git ten-thu-muc
```

---

## 🔧 CÁC LỆNH HỮU ÍCH KHÁC

### Xem thay đổi

```bash
# Xem thay đổi chưa commit
git diff

# Xem thay đổi đã stage
git diff --staged

# Xem thay đổi giữa 2 commit
git diff <commit1> <commit2>
```

### Xóa file

```bash
# Xóa file khỏi Git (giữ file trên máy)
git rm --cached ten_file.js

# Xóa file khỏi Git và máy
git rm ten_file.js

# Sau đó commit
git commit -m "Xóa file không cần thiết"
```

### Đổi tên file

```bash
# Đổi tên file
git mv ten_file_cu.js ten_file_moi.js

# Sau đó commit
git commit -m "Đổi tên file"
```

### Stash (Tạm lưu thay đổi)

```bash
# Lưu thay đổi tạm thời
git stash

# Xem danh sách stash
git stash list

# Lấy lại thay đổi từ stash
git stash pop

# Xóa stash
git stash drop
```

---

## 📝 QUY TRÌNH LÀM VIỆC CƠ BẢN

### Quy trình hàng ngày:

```bash
# 1. Kiểm tra trạng thái
git status

# 2. Xem thay đổi
git diff

# 3. Thêm file vào staging
git add .

# 4. Commit
git commit -m "Mô tả thay đổi"

# 5. Push lên remote
git push
```

### Quy trình khi làm việc nhóm:

```bash
# 1. Pull code mới nhất
git pull

# 2. Tạo branch mới cho tính năng
git checkout -b feature/ten-tinh-nang

# 3. Làm việc và commit
git add .
git commit -m "Thêm tính năng X"

# 4. Push branch lên remote
git push -u origin feature/ten-tinh-nang

# 5. Tạo Pull Request trên GitHub/GitLab

# 6. Sau khi merge, xóa branch local
git checkout main
git pull
git branch -d feature/ten-tinh-nang
```

---

## ⚠️ CÁC LỆNH NGUY HIỂM (Cẩn thận!)

```bash
# Xóa tất cả thay đổi chưa commit
git reset --hard HEAD

# Xóa tất cả file không được track
git clean -fd

# Force push (ghi đè lịch sử)
git push --force
```

**⚠️ Lưu ý:** Chỉ dùng khi chắc chắn, có thể mất dữ liệu!

---

## 🎯 CÁC TÌNH HUỐNG THƯỜNG GẶP

### 1. Quên commit message

```bash
# Sửa commit message của commit cuối
git commit --amend -m "Message mới"
```

### 2. Quên thêm file vào commit

```bash
# Thêm file vào commit cuối
git add ten_file.js
git commit --amend --no-edit
```

### 3. Hoàn tác commit (giữ thay đổi)

```bash
# Hoàn tác commit cuối, giữ thay đổi
git reset --soft HEAD~1
```

### 4. Hoàn tác commit (xóa thay đổi)

```bash
# Hoàn tác commit cuối, xóa thay đổi
git reset --hard HEAD~1
```

### 5. Xung đột khi merge

```bash
# Khi có conflict, Git sẽ đánh dấu
# Sửa file conflict thủ công
# Sau đó:
git add .
git commit -m "Giải quyết conflict"
```

### 6. Xem file đã thay đổi ở commit cụ thể

```bash
# Xem danh sách file đã thay đổi
git show --name-only <commit-hash>

# Xem nội dung thay đổi
git show <commit-hash>
```

---

## 📚 CÁC FILE QUAN TRỌNG

### `.gitignore`
File này chứa danh sách file/thư mục Git sẽ bỏ qua.

**Ví dụ `.gitignore` cho Node.js:**
```
node_modules/
.env
.DS_Store
*.log
dist/
build/
```

### `.gitattributes`
File cấu hình Git attributes (line endings, etc.)

---

## 🔍 TÌM KIẾM

```bash
# Tìm trong commit messages
git log --grep="từ khóa"

# Tìm trong code
git grep "từ khóa"

# Tìm file
git ls-files | grep "tên file"
```

---

## 📖 TÀI LIỆU THAM KHẢO

- **Git Documentation:** https://git-scm.com/doc
- **GitHub Guides:** https://guides.github.com/
- **Atlassian Git Tutorial:** https://www.atlassian.com/git/tutorials

---

## 💡 MẸO HỮU ÍCH

### 1. Tạo alias (tên tắt)

```bash
# Tạo alias cho các lệnh thường dùng
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit

# Sau đó có thể dùng:
git st  # thay vì git status
git co  # thay vì git checkout
```

### 2. Xem log đẹp hơn

```bash
# Tạo alias cho log đẹp
git config --global alias.lg "log --oneline --graph --decorate --all"

# Dùng:
git lg
```

### 3. Xem thay đổi theo file

```bash
# Xem file nào đã thay đổi nhiều nhất
git log --stat

# Xem thay đổi của file cụ thể
git log -- ten_file.js
```

---

## ✅ CHECKLIST TRƯỚC KHI COMMIT

- [ ] Đã test code chạy được
- [ ] Đã xóa code comment/debug không cần thiết
- [ ] Đã kiểm tra không có lỗi syntax
- [ ] Commit message rõ ràng, mô tả đúng thay đổi
- [ ] Đã thêm file cần thiết vào `.gitignore`

---

## 🎓 BÀI TẬP THỰC HÀNH

### Bài 1: Tạo repository mới
```bash
mkdir my-project
cd my-project
git init
echo "# My Project" > README.md
git add README.md
git commit -m "Initial commit"
```

### Bài 2: Tạo branch và merge
```bash
git checkout -b feature/new-feature
echo "New feature" > feature.txt
git add feature.txt
git commit -m "Add new feature"
git checkout main
git merge feature/new-feature
```

### Bài 3: Xem lịch sử
```bash
git log --oneline
git show <commit-hash>
```

---

**Chúc bạn học Git thành công! 🎉**

