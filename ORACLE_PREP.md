# ORACLE_PREP — Lấp khoảng trống Oracle / PL-SQL

> **Bối cảnh:** JD yêu cầu **Oracle (PL/SQL)** + **VB.NET**. Cả 2 project trong CV dùng **SQL Server + C#**.
> Tech lead gần như chắc chắn hỏi *"Bạn đã làm Oracle chưa?"*. File này giúp bạn trả lời có **chiều sâu +
> bằng chứng cụ thể**, thay vì "em chưa làm nhưng học nhanh".

**Chiến lược cốt lõi:** đừng trả lời suông. Hãy **port project QuanLySinhVien sang Oracle** (DDL + query +
vài PL/SQL) để có thứ THẬT mà kể. Nền tảng SQL là chung — bạn chỉ cần dịch cú pháp và học đặc thù Oracle.

---

## 1. Kịch bản trả lời "Bạn đã làm Oracle chưa?"

**Khung trả lời (trung thực → bắc cầu → bằng chứng → cam kết):**

> *"Trong 2 project của em thì database dùng SQL Server, nên em chưa có kinh nghiệm Oracle trong dự án
> thực tế. Tuy nhiên nền tảng SQL cốt lõi — thiết kế bảng, JOIN, GROUP BY, index, transaction/ACID, đọc
> execution plan để tối ưu query — là chung cho mọi RDBMS. Để chuẩn bị cho vị trí này, em đã tự tìm hiểu
> khác biệt giữa SQL Server và Oracle và **port thử schema project quản lý sinh viên của em sang Oracle**:
> đổi `IDENTITY` sang `SEQUENCE`/`IDENTITY` của Oracle, `VARCHAR` sang `VARCHAR2`, `GETDATE()` sang
> `SYSDATE`, và viết thử một vài **stored procedure, function tính điểm trung bình, trigger tự cập nhật sĩ
> số lớp và một package PL/SQL**. Em tin với nền tảng SQL sẵn có, em sẽ bắt nhịp Oracle nhanh trong vài
> tuần đầu."*

**3 nguyên tắc khi trả lời:**
1. **Đừng nói dối** là đã làm Oracle production — dễ bị hỏi sâu và lộ ngay (vd `''` = NULL, package, `%ROWTYPE`).
2. **Bắc cầu** ngay sang thứ bạn CÓ: SQL Server, tư duy SQL, thiết kế CSDL.
3. **Đưa bằng chứng** đã chủ động học (chính là những mục 3–6 dưới đây).

**Nếu bị hỏi vặn "khác biệt lớn nhất giữa SQL Server và Oracle là gì?"** → chọn 2–3 cái bạn nhớ chắc:
`SEQUENCE.NEXTVAL` thay cho IDENTITY; `||` để nối chuỗi; **chuỗi rỗng `''` bị coi là NULL** (bẫy kinh
điển); Oracle có **PACKAGE** gom procedure/function; phân trang `FETCH FIRST n ROWS ONLY`/`ROWNUM`.

---

## 2. Bảng đối chiếu SQL Server ↔ Oracle (học thuộc)

| Chủ đề | SQL Server (T-SQL) | Oracle (PL/SQL) |
|---|---|---|
| Tăng tự động | `IDENTITY(1,1)` | `GENERATED ALWAYS AS IDENTITY` hoặc `SEQUENCE` + `.NEXTVAL` |
| Kiểu chuỗi | `VARCHAR(n)`, `NVARCHAR(n)` | `VARCHAR2(n)`, `NVARCHAR2(n)` |
| Số thực | `FLOAT`, `DECIMAL` | `NUMBER`, `BINARY_DOUBLE` |
| Ngày giờ | `DATETIME`, `GETDATE()` | `DATE`/`TIMESTAMP`, `SYSDATE`/`SYSTIMESTAMP` |
| Nối chuỗi | `a + b` / `CONCAT(a,b)` | `a || b` |
| NULL default | `ISNULL(a,b)` | `NVL(a,b)` (hoặc `COALESCE` — cả 2 đều có) |
| Lấy N dòng đầu | `SELECT TOP 10 ...` | `... FETCH FIRST 10 ROWS ONLY` hoặc `WHERE ROWNUM<=10` |
| Phân trang | `OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY` | `OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY` (12c+) |
| Upsert | `MERGE` | `MERGE` |
| Cắt bảng | `TRUNCATE TABLE t` | `TRUNCATE TABLE t` |
| Biến trong thủ tục | `DECLARE @x INT` | `x NUMBER;` (không có `@`) |
| Khối lệnh | `BEGIN ... END` (T-SQL) | `DECLARE ... BEGIN ... EXCEPTION ... END;` (PL/SQL) |
| Gọi thủ tục | `EXEC sp_Name @p` | `EXEC proc_name(p)` hoặc trong block `BEGIN proc_name(p); END;` |
| Kết thúc lệnh/batch | `GO` | `;` cho câu lệnh, `/` để chạy block PL/SQL |
| **Chuỗi rỗng** | `''` khác `NULL` | **`''` bị coi là `NULL`** ⚠️ bẫy hay gặp |
| Giới hạn tên đối tượng | 128 ký tự | 30 ký tự (đến 11g) / 128 (12.2+) |
| Comment biến hệ thống | `@@IDENTITY`, `SCOPE_IDENTITY()` | `sequence.CURRVAL` |
| Gom nhóm logic DB | (không có package) | **PACKAGE** (spec + body) |

---

## 3. Port schema QuanLySinhVien sang Oracle (DDL)

Đây là bản Oracle của `sqlC#.sql`. **Đã sửa luôn lỗi thiết kế `Diem.MaSV unique`** (đổi sang khóa tổ hợp).

```sql
-- ===== Oracle DDL cho QuanLySinhVien =====

CREATE TABLE TaiKhoan (
    Id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    TenDangNhap   VARCHAR2(255) UNIQUE,
    MatKhau       VARCHAR2(255) NOT NULL,
    LoaiTaiKhoan  NVARCHAR2(40) DEFAULT N'Cố vấn học tập'
);

CREATE TABLE Khoa (
    Id       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    MaKhoa   VARCHAR2(255) UNIQUE,
    TenKhoa  NVARCHAR2(255) NOT NULL
);

CREATE TABLE Lop (
    Id       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    MaLop    VARCHAR2(255) UNIQUE,
    TenLop   NVARCHAR2(255) NOT NULL,
    SoLuong  NUMBER DEFAULT 0,
    MaKhoa   VARCHAR2(255) NOT NULL,
    CONSTRAINT FK_Lop_Khoa FOREIGN KEY (MaKhoa) REFERENCES Khoa(MaKhoa)
);

CREATE TABLE CoVanHocTap (
    Id       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    MaCVHT   VARCHAR2(255) UNIQUE,
    TenCVHT  NVARCHAR2(255) NOT NULL,
    NgaySinh DATE DEFAULT SYSDATE,
    GioiTinh NVARCHAR2(4) NOT NULL,
    MaKhoa   VARCHAR2(255) NOT NULL,
    MaLop    VARCHAR2(255) NOT NULL,
    CONSTRAINT FK_CVHT_Khoa FOREIGN KEY (MaKhoa) REFERENCES Khoa(MaKhoa),
    CONSTRAINT FK_CVHT_Lop  FOREIGN KEY (MaLop)  REFERENCES Lop(MaLop)
);

CREATE TABLE MonHoc (
    Id     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    MaMH   VARCHAR2(255) UNIQUE,
    TenMH  NVARCHAR2(255) NOT NULL,
    SoTC   NUMBER DEFAULT 0,
    TietLT NUMBER DEFAULT 0,   -- số tiết lý thuyết
    TietTH NUMBER DEFAULT 0    -- số tiết thực hành
);

CREATE TABLE SinhVien (
    Id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    MaSV        VARCHAR2(255) UNIQUE,
    TenSV       NVARCHAR2(255) NOT NULL,
    NgaySinh    DATE DEFAULT SYSDATE,
    GioiTinh    NVARCHAR2(4) NOT NULL,
    QueQuan     NVARCHAR2(255) NOT NULL,
    NgayNhapHoc DATE DEFAULT SYSDATE,
    MaLop       VARCHAR2(255) NOT NULL,
    MaKhoa      VARCHAR2(255) NOT NULL,
    MaCVHT      VARCHAR2(255) NOT NULL,
    CONSTRAINT FK_SV_Lop  FOREIGN KEY (MaLop)  REFERENCES Lop(MaLop),
    CONSTRAINT FK_SV_Khoa FOREIGN KEY (MaKhoa) REFERENCES Khoa(MaKhoa),
    CONSTRAINT FK_SV_CVHT FOREIGN KEY (MaCVHT) REFERENCES CoVanHocTap(MaCVHT)
);

CREATE TABLE Diem (
    Id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    MaSV           VARCHAR2(255) NOT NULL,
    MaMH           VARCHAR2(255) NOT NULL,
    PhanTramTrenLop NUMBER DEFAULT 0,
    PhanTramThi    NUMBER DEFAULT 0,
    DiemTrenLop    NUMBER DEFAULT 0,
    DiemThi        NUMBER DEFAULT 0,
    DiemTB         NUMBER DEFAULT 0,
    Loai           CHAR(1) DEFAULT 'f',
    NamHoc         NUMBER,
    CONSTRAINT FK_Diem_SV FOREIGN KEY (MaSV) REFERENCES SinhVien(MaSV),
    CONSTRAINT FK_Diem_MH FOREIGN KEY (MaMH) REFERENCES MonHoc(MaMH),
    -- ĐÃ SỬA LỖI: bỏ unique(MaSV), dùng khóa tổ hợp để 1 SV có điểm nhiều môn/năm
    CONSTRAINT UQ_Diem UNIQUE (MaSV, MaMH, NamHoc)
);
```

**Điểm để nói khi phỏng vấn:** `N'...'` cho literal Unicode; `SYSDATE` thay `GETDATE()`; `NUMBER` thay
`int/float`; ràng buộc FK đặt tên rõ (`CONSTRAINT FK_...`) — Oracle khuyến khích đặt tên constraint để dễ
quản lý/drop.

---

## 4. Dịch các query trong DAL sang Oracle

Các câu SQL trong DAL của bạn hầu như **giữ nguyên** (SQL chuẩn), chỉ khác vài chỗ:

**a) Lấy danh sách + JOIN** (`ListStudentJoinedOtherTables`) — gần như y hệt, chỉ bỏ prefix `dbo.`:
```sql
SELECT sv.Id, sv.MaSV, sv.TenSV, sv.NgaySinh, sv.GioiTinh, sv.QueQuan,
       sv.NgayNhapHoc, l.TenLop, k.TenKhoa, cv.TenCVHT
FROM SinhVien sv
LEFT JOIN Lop         l  ON l.MaLop  = sv.MaLop
LEFT JOIN Khoa        k  ON k.MaKhoa = sv.MaKhoa
LEFT JOIN CoVanHocTap cv ON cv.MaCVHT = sv.MaCVHT;
```

**b) Tham số:** SQL Server dùng `@MaSV`, Oracle dùng **`:MaSV`** (bind variable). Trong .NET với
`Oracle.ManagedDataAccess`:
```csharp
using var conn = new OracleConnection(connStr);
using var cmd  = new OracleCommand(
    "INSERT INTO SinhVien (MaSV, TenSV, MaLop) VALUES (:MaSV, :TenSV, :MaLop)", conn);
cmd.Parameters.Add(":MaSV",  maSV);
cmd.Parameters.Add(":TenSV", tenSV);
cmd.Parameters.Add(":MaLop", maLop);
```
> ⚠️ Oracle mặc định **bind theo tên** nhưng `BindByName` của `OracleCommand` **mặc định false** → nó
> bind theo **thứ tự**. Nhớ set `cmd.BindByName = true` nếu muốn bind theo tên. (Đây là chi tiết "insider"
> nói ra sẽ rất ấn tượng.)

**c) Phân trang / top N:**
```sql
-- SQL Server:  SELECT TOP 10 * FROM SinhVien ORDER BY TenSV
-- Oracle:
SELECT * FROM SinhVien ORDER BY TenSV FETCH FIRST 10 ROWS ONLY;
```

---

## 5. PL/SQL crash course — trên chính schema của bạn

Học 5 dạng cốt lõi. Mỗi cái 1 ví dụ chạy được trên schema QuanLySinhVien.

### 5.1 Stored Procedure — thêm sinh viên
```sql
CREATE OR REPLACE PROCEDURE ThemSinhVien(
    p_MaSV  IN VARCHAR2,
    p_TenSV IN NVARCHAR2,
    p_MaLop IN VARCHAR2,
    p_MaKhoa IN VARCHAR2,
    p_MaCVHT IN VARCHAR2
) AS
BEGIN
    INSERT INTO SinhVien (MaSV, TenSV, GioiTinh, QueQuan, MaLop, MaKhoa, MaCVHT)
    VALUES (p_MaSV, p_TenSV, N'Nam', N'N/A', p_MaLop, p_MaKhoa, p_MaCVHT);
    COMMIT;
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        RAISE_APPLICATION_ERROR(-20001, 'Ma sinh vien da ton tai');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/
```

### 5.2 Function — tính điểm trung bình 1 sinh viên
```sql
CREATE OR REPLACE FUNCTION TinhDiemTB_SV(p_MaSV IN VARCHAR2)
RETURN NUMBER AS
    v_avg NUMBER;
BEGIN
    SELECT AVG(DiemTB) INTO v_avg
    FROM Diem
    WHERE MaSV = p_MaSV;

    RETURN NVL(v_avg, 0);   -- NVL: nếu chưa có điểm thì trả 0
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
END;
/
-- Gọi:  SELECT TinhDiemTB_SV('SV001') FROM dual;
```
> `dual` là bảng ảo 1 dòng của Oracle, dùng để `SELECT` biểu thức/hàm.

### 5.3 Cursor — duyệt từng sinh viên (in bảng điểm)
```sql
DECLARE
    CURSOR c_sv IS
        SELECT MaSV, TenSV FROM SinhVien WHERE MaLop = 'L01';
    v_tb NUMBER;
BEGIN
    FOR r IN c_sv LOOP          -- cursor FOR loop: tự OPEN/FETCH/CLOSE
        v_tb := TinhDiemTB_SV(r.MaSV);
        DBMS_OUTPUT.PUT_LINE(r.TenSV || ' - DiemTB: ' || v_tb);
    END LOOP;
END;
/
```

### 5.4 Trigger — tự cập nhật sĩ số lớp khi thêm/xóa sinh viên
```sql
CREATE OR REPLACE TRIGGER trg_CapNhatSiSo
AFTER INSERT OR DELETE ON SinhVien
FOR EACH ROW
BEGIN
    IF INSERTING THEN
        UPDATE Lop SET SoLuong = SoLuong + 1 WHERE MaLop = :NEW.MaLop;
    ELSIF DELETING THEN
        UPDATE Lop SET SoLuong = SoLuong - 1 WHERE MaLop = :OLD.MaLop;
    END IF;
END;
/
```
> `:NEW` / `:OLD` là dòng sau/trước thay đổi — khái niệm rất hay bị hỏi.

### 5.5 Package — gom logic quản lý sinh viên (đặc trưng Oracle)
```sql
-- Spec (khai báo public)
CREATE OR REPLACE PACKAGE pkg_SinhVien AS
    PROCEDURE Them(p_MaSV VARCHAR2, p_TenSV NVARCHAR2, p_MaLop VARCHAR2);
    FUNCTION  DemTheoLop(p_MaLop VARCHAR2) RETURN NUMBER;
END pkg_SinhVien;
/
-- Body (hiện thực)
CREATE OR REPLACE PACKAGE BODY pkg_SinhVien AS
    PROCEDURE Them(p_MaSV VARCHAR2, p_TenSV NVARCHAR2, p_MaLop VARCHAR2) AS
    BEGIN
        INSERT INTO SinhVien (MaSV, TenSV, GioiTinh, QueQuan, MaLop, MaKhoa, MaCVHT)
        VALUES (p_MaSV, p_TenSV, N'Nam', N'N/A', p_MaLop, 'K01', 'CV01');
    END;

    FUNCTION DemTheoLop(p_MaLop VARCHAR2) RETURN NUMBER AS
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_count FROM SinhVien WHERE MaLop = p_MaLop;
        RETURN v_count;
    END;
END pkg_SinhVien;
/
-- Gọi:  EXEC pkg_SinhVien.Them('SV002', N'Nguyen Van B', 'L01');
```
**Package là điểm SQL Server KHÔNG có** → nhắc đến nó cho thấy bạn thật sự tìm hiểu Oracle, không chỉ dịch cú pháp.

---

## 6. Câu hỏi Oracle hay gặp — trả lời ngắn gọn

| Câu hỏi | Trả lời gọn |
|---|---|
| `VARCHAR` vs `VARCHAR2`? | Dùng **`VARCHAR2`**. `VARCHAR` là kiểu để dành (reserved), Oracle khuyến cáo không dùng vì hành vi có thể đổi. |
| `NVL` vs `NVL2` vs `COALESCE`? | `NVL(a,b)`: a null→b. `NVL2(a,b,c)`: a khác null→b, null→c. `COALESCE`: trả giá trị non-null đầu tiên trong danh sách. |
| `DECODE` là gì? | Hàm rẽ nhánh cũ của Oracle: `DECODE(x, 1,'A', 2,'B', 'khac')` ~ `CASE`. |
| `ROWNUM` vs `ROW_NUMBER()`? | `ROWNUM` là pseudo-column đánh số **trước ORDER BY** (bẫy!); `ROW_NUMBER() OVER(ORDER BY..)` đánh sau, dùng cho phân trang/top-N chuẩn. |
| Procedure vs Function? | Function **phải return** giá trị, gọi được trong SELECT; procedure dùng cho hành động, có thể có tham số `OUT`. |
| `%TYPE` / `%ROWTYPE`? | Khai báo biến "ăn theo" kiểu cột/dòng: `v_ten SinhVien.TenSV%TYPE;` — tự đổi khi đổi kiểu cột. |
| Xử lý ngoại lệ? | Khối `EXCEPTION WHEN <tên> THEN ...`; các exception có sẵn: `NO_DATA_FOUND`, `TOO_MANY_ROWS`, `DUP_VAL_ON_INDEX`. |
| Sequence dùng sao? | `CREATE SEQUENCE seq START WITH 1 INCREMENT BY 1;` rồi `seq.NEXTVAL` / `seq.CURRVAL`. |
| `''` trong Oracle? | Bị coi là **NULL** → so sánh phải dùng `IS NULL`, không dùng `= ''`. |
| `dual` là gì? | Bảng ảo 1 dòng để SELECT biểu thức/hàm/sequence. |

---

## 7. Kế hoạch 1 tuần để trả lời được có chiều sâu

**Công cụ miễn phí không cần cài đặt:** **Oracle Live SQL** (`livesql.oracle.com`) — chạy Oracle
trên trình duyệt. Hoặc **Oracle Database XE** (bản free) + **Oracle SQL Developer**.

- **Ngày 1–2:** Chạy DDL ở [Mục 3] trên Live SQL; insert ít dữ liệu mẫu; viết lại các query DAL ở [Mục 4].
- **Ngày 3–4:** Viết + chạy 5 dạng PL/SQL ở [Mục 5] (procedure, function, cursor, trigger, package).
- **Ngày 5:** Học thuộc bảng đối chiếu [Mục 2] và Q&A [Mục 6].
- **Ngày 6:** Luyện nói kịch bản [Mục 1] thành tiếng, tự quay lại nghe.
- **Ngày 7:** Ôn tổng hợp; chuẩn bị 2–3 khác biệt SQL Server↔Oracle để nói chắc khi bị hỏi vặn.

**Sau tuần này, câu trả lời của bạn nâng cấp thành:**
> *"Em chưa dùng Oracle trong dự án thực tế, nhưng em đã port project quản lý sinh viên sang Oracle trên
> Oracle Live SQL — viết lại DDL, chuyển query, và viết thử stored procedure tính điểm, trigger cập nhật
> sĩ số, và một package gom nghiệp vụ. Em nắm được các khác biệt chính như SEQUENCE, VARCHAR2, bind
> variable `:param`, và bẫy `''` = NULL của Oracle."*

Đó là câu trả lời của người **đã chủ động chuẩn bị**, không phải người chỉ hứa "học nhanh".
```
