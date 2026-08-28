# Ung dung Quan ly chi tieu ca nhan

Du an day du gom Backend (Node.js + Express + PostgreSQL) va Frontend (React + Vite),
tich hop kien thuc 4 hoc phan: Cong nghe phan mem, Ky thuat lap trinh nang cao,
An toan va bao mat thong tin, Phat trien ung dung tren nen Web.

## Cau truc thu muc

```
expense-manager/
  backend/            Node.js + Express API, PostgreSQL, JWT, bcrypt, AES
    src/
      config/db.js         Ket noi PostgreSQL (connection pool)
      controllers/          Xu ly nghiep vu (auth, transaction, category, budget)
      middleware/           auth (JWT), rate limit, error handler
      routes/                Dinh nghia API + validate input
      utils/                 jwt.js, crypto.js (AES-256-GCM), audit.js
      db/schema.sql          Script tao bang CSDL
    .env.example
    Dockerfile
  frontend/            React + Vite SPA goi API that
    src/
      api/client.js         Axios + tu dong refresh token
      context/AuthContext.jsx
      pages/                Login, Register, Dashboard
      components/            OverviewTab, TransactionsTab, BudgetsTab, TxModal
  docker-compose.yml   Chay nhanh PostgreSQL + backend bang Docker
```

## Cach chay nhanh nhat (dung Docker cho backend + CSDL)

Yeu cau: da cai Docker Desktop va Node.js (>= 18) tren may.

```bash
# 1. Chay PostgreSQL + backend
cd expense-manager
docker compose up -d --build

# 2. Tao bang trong CSDL (chi can chay 1 lan dau)
docker compose exec backend node src/db/migrate.js

# 3. Chay frontend
cd frontend
npm install
cp .env.example .env
npm run dev
```

Mo trinh duyet tai `http://localhost:5173`, dang ky tai khoan moi va bat dau su dung.

## Cach chay khong dung Docker (cai PostgreSQL that tren may)

```bash
# 1. Tao database
createdb expense_manager   # hoac tao bang pgAdmin/DBeaver

# 2. Cai va cau hinh backend
cd backend
npm install
cp .env.example .env
# Mo .env, chinh DATABASE_URL cho dung thong tin PostgreSQL cua ban
# Tao khoa ma hoa that:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Dan gia tri vao ENCRYPTION_KEY trong .env

# 3. Tao bang
npm run migrate

# 4. Chay backend (che do phat trien, tu dong reload)
npm run dev
# Backend chay tai http://localhost:4000

# 5. Cai va chay frontend (mo terminal moi)
cd ../frontend
npm install
cp .env.example .env
npm run dev
# Frontend chay tai http://localhost:5173
```

## Danh sach API chinh

| Method | Endpoint | Mo ta | Yeu cau dang nhap |
|---|---|---|---|
| POST | /api/auth/register | Dang ky tai khoan | Khong |
| POST | /api/auth/login | Dang nhap, tra ve access + refresh token | Khong |
| POST | /api/auth/refresh | Lam moi access token | Khong (can refresh token) |
| GET | /api/auth/me | Thong tin tai khoan hien tai | Co |
| GET | /api/categories | Danh sach danh muc | Co |
| POST | /api/categories | Tao danh muc moi | Co |
| DELETE | /api/categories/:id | Xoa danh muc | Co |
| GET | /api/transactions?month=YYYY-MM | Danh sach giao dich theo thang | Co |
| POST | /api/transactions | Them giao dich | Co |
| PUT | /api/transactions/:id | Sua giao dich | Co |
| DELETE | /api/transactions/:id | Xoa giao dich | Co |
| GET | /api/transactions/summary?month=YYYY-MM | Tong hop bao cao cho dashboard | Co |
| GET | /api/budgets?month=YYYY-MM | Han muc ngan sach theo thang | Co |
| POST | /api/budgets | Tao/cap nhat han muc | Co |

## Cac bien phap bao mat da ap dung (mon An toan va bao mat thong tin)

- **Xac thuc**: JWT access token (het han sau 15 phut) + refresh token (7 ngay), tu dong lam moi o frontend.
- **Mat khau**: bam bang bcrypt (12 vong salt), khong bao gio luu/tra ve plaintext.
- **Chong brute-force**: khoa tam tai khoan sau 5 lan dang nhap sai; gioi han toc do (rate limit) 10 lan/15 phut cho /login va /register.
- **Chong SQL Injection**: moi truy van dung tham so hoa ($1, $2...) qua thu vien `pg`, khong noi chuoi SQL.
- **Ma hoa du lieu nhay cam**: truong ghi chu giao dich duoc ma hoa AES-256-GCM truoc khi luu vao CSDL (xem `backend/src/utils/crypto.js`).
- **HTTP security headers**: dung `helmet` de dat cac header bao ve (chong clickjacking, sniffing...).
- **CORS**: chi cho phep domain frontend duoc cau hinh trong `CORS_ORIGIN` goi API.
- **Validate input**: dung `express-validator` kiem tra du lieu dau vao o moi route (email, do dai mat khau, so tien > 0...).
- **Phan quyen (RBAC)**: cot `role` trong bang `users`, middleware `requireRole` san sang mo rong cho trang quan tri.
- **Audit log**: bang `audit_logs` ghi lai dang nhap thanh cong/that bai, tao/sua/xoa giao dich, kem dia chi IP.
- **Gioi han kich thuoc request**: `express.json({ limit: "100kb" })` de tranh tan cong DoS bang payload lon.

## Goi y kiem thu bao mat khi bao cao do an

- Dung Postman/curl thu dang nhap sai 6 lan lien tiep de xem tai khoan bi khoa tam.
- Thu gui truong `note` chua ma HTML/script (`<script>alert(1)</script>`) de kiem tra frontend co hien thi an toan khong (React tu dong escape).
- Mo pgAdmin xem truc tiep cot `note_encrypted` trong bang `transactions` de chung minh du lieu da duoc ma hoa, khong doc duoc bang mat thuong.
- Dung cong cu OWASP ZAP quet nhanh API de bo sung vao bao cao kiem thu.

## Tinh nang moi: Nap tien tiet kiem qua QR chuyen khoan ngan hang

Module "Tiet kiem" cho phep tao nhieu so/muc tieu tiet kiem, nap/rut tien, va **nap tien bang cach quet ma QR chuyen khoan ngan hang that** (chuan VietQR - anh QR duoc sinh qua dich vu cong khai `img.vietqr.io`).

**Cach hoat dong:**
1. Vao **Cai dat**, lien ket tai khoan ngan hang nhan tien (chon ngan hang, nhap so tai khoan + ten chu tai khoan).
2. Vao **Tiet kiem** &rarr; chon so tiet kiem &rarr; **Nap tien** &rarr; **Nap qua QR chuyen khoan**.
3. Nhap so tien, he thong tao ma QR kem noi dung chuyen khoan la ma tham chieu duy nhat (vi du `TK3F91A2`).
4. Quet QR bang app ngan hang bat ky va chuyen khoan that.
5. Sau khi chuyen xong, bam **"Toi da chuyen khoan xong"** &rarr; he thong cong tien vao so tiet kiem va bao thanh cong ngay.

**Gioi han quan trong cua ban demo/do an:** buoc xac nhan o (5) hien dang do nguoi dung tu thao tac, vi he thong chua ket noi webhook ngan hang that (can dang ky dich vu doi soat giao dich nhu **Casso.vn**, **SePay**, hoac lam viec truc tiep voi ngan hang - thuong yeu cau tai khoan doanh nghiep). Kien truc backend (bang `transfer_requests` voi trang thai `pending/confirmed`, API `GET /api/savings/qr-deposit/:refCode/status`) da duoc thiet ke san theo dung mo hinh cac vi dien tu that dung, nen khi co webhook that ban chi can:
- Them 1 endpoint `POST /api/webhooks/casso` (hoac tuong tu) nhan thong bao giao dich moi ve tai khoan.
- Doi chieu noi dung chuyen khoan voi `ref_code` trong bang `transfer_requests`.
- Neu khop va dung so tien &rarr; tu dong goi lai logic trong `confirmQrDeposit` de cong tien, khong can nguoi dung bam xac nhan thu cong nua.

Day la diem co the trinh bay rat tot trong bao cao do an: ban da thiet ke dung "kien truc san sang cho tich hop that" (idempotent, co trang thai, co ma tham chieu doi soat) dung nguyen tac cua he thong thanh toan thuc te, chi con thieu 1 mieng ghep la webhook tra phi.

## Cau truc thu muc (cap nhat)

```
expense-manager/
  backend/
    src/
      controllers/
        savingsController.js   CRUD so tiet kiem + logic QR deposit (initiate/status/confirm)
        userController.js       Quan ly tai khoan ngan hang lien ket
      routes/
        savingsRoutes.js
        userRoutes.js
      db/schema.sql             + bang savings_accounts, savings_transactions, transfer_requests
  frontend/
    src/
      theme.js                 Design tokens dung chung (mau sac, bo goc, shadow)
      bankList.js               Danh sach ngan hang + ma BIN VietQR
      components/
        Sidebar.jsx              Dieu huong sidebar chuyen nghiep
        SavingsTab.jsx           Danh sach so tiet kiem dang the, thanh tien do
        SavingsAccountModal.jsx  Tao so tiet kiem moi
        SavingsMoveModal.jsx     Nap/rut thu cong (tien mat)
        QrDepositModal.jsx       Luong nap tien qua QR chuyen khoan + xac nhan
        AuthBrandPanel.jsx       Panel thuong hieu cho trang dang nhap/dang ky
      pages/
        Settings.jsx             Lien ket tai khoan ngan hang
```



## Huong phat trien tiep theo

- Them xac thuc 2 lop (OTP qua email) khi dang nhap.
- Trang quan tri cho `role = admin` xem toan bo audit log.
- Xuat bao cao ra Excel/PDF.
- Trien khai len Render/Railway (backend) va Vercel/Netlify (frontend).
