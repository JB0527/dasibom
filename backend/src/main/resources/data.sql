-- 더미 데이터 삽입 (existing data가 없는 경우에만)
INSERT INTO missing_case (
    id, occrde, nm, sexdstn_dscd, age, age_now, wrtng_trget_dscd,
    occr_adres, alldressing_dscd, height, bdwgh, frm_dscd,
    faceshpe_dscd, hairshpe_dscd, haircolr_dscd, tknphotolength,
    file_url, msspsnidntfccd, etc_spfeatr, case_status,
    last_checked_at, source_updated_at, created_at, updated_at, ai_image_url
) VALUES
(1000, '20250926', '이민준', '남자', 26, 26, '020',
 '서울특별시 강남구 영동대로 513', '캐주얼차림', 175, 70, '건강한',
 '계란형', '짧은머리', '흑색', 23580,
 's3://seoul-ht-06-dasibom/inputs/missing-person-1/nofacewithstyle (3).jpg', 5800123, '뿔테안경 착용', 'OPEN',
 '2025-09-26 09:15:30.123456', '2025-09-26 09:15:30.123452', '2025-09-26 16:30:15.234567', '2025-09-26 09:15:30.125789',
 'https://seoul-ht-06-dasibom.s3.us-west-1.amazonaws.com/ai_image/%EC%9D%B4%EB%AF%BC%EC%A4%80.png'),

(1001, '20250926', '변정효', '남자', 26, 26, '020',
 '서울특별시 강남구 테헤란로 212', '캐주얼차림', 190, 110, '통통한',
 '계란형', '짧은머리', '흑색', 24120,
 's3://seoul-ht-06-dasibom/inputs/missing-person-2/nofacewithstyle (2).jpg', 5800124, '뿔테안경 착용', 'OPEN',
 '2025-09-26 10:22:15.234567', '2025-09-26 10:22:15.234563', '2025-09-26 14:45:30.345678', '2025-09-26 10:22:15.236890',
 'https://seoul-ht-06-dasibom.s3.us-west-1.amazonaws.com/ai_image/%EB%B3%80%EC%A0%95%ED%9A%A8.png'),

(1002, '20250926', '민지소', '남자', 26, 26, '020',
 '경기도 수원시 세류로 60', '캐주얼차림', 160, 50, '왜소한',
 '계란형', '짧은머리', '흑색', 22890,
 's3://seoul-ht-06-dasibom/inputs/missing-person-3/lowface (3).jpg', 5800125, '뿔테안경 착용', 'OPEN',
 '2025-09-26 11:35:42.456789', '2025-09-26 11:35:42.456785', '2025-09-26 13:20:45.567890', '2025-09-26 11:35:42.459012',
 'https://seoul-ht-06-dasibom.s3.us-west-1.amazonaws.com/ai_image/%EB%AF%BC%EC%A7%80%EC%86%8C.png'),

(1003, '19850315', '류영재', '남자', 26, 66, '020',
 '서울특별시 종로구 인사동길 12', '정장차림', 172, 68, '보통',
 '계란형', '짧은머리', '흑색', 28340,
 's3://seoul-ht-06-dasibom/inputs/missing-person-2/face_main.jpg', 5800126, '뿔테안경 착용', 'OPEN',
 '2025-09-26 08:45:12.789123', '2025-09-26 08:45:12.789119', '1985-03-16 09:30:00.123456', '2025-09-26 08:45:12.791456',
 'https://seoul-ht-06-dasibom.s3.us-west-1.amazonaws.com/ai_image/%EB%A5%98%EC%98%81%EC%9E%AC.png')
ON DUPLICATE KEY UPDATE id = VALUES(id);