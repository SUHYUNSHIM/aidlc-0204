# Infrastructure Design Plan - Unit 2: Admin Frontend

## 실행 체크리스트

### Phase 1: 인프라 매핑
- [x] 배포 환경 결정
- [x] 정적 파일 호스팅 선택
- [x] CDN 설정

### Phase 2: 문서화
- [x] infrastructure-design.md 생성
- [x] deployment-architecture.md 생성

---

## 명확화 질문

### Q1: 배포 환경
Admin Frontend를 어디에 배포할까요?

A) **로컬 개발만** - 로컬 환경에서만 실행 (배포 안함)
B) **AWS S3 + CloudFront** - S3에 정적 파일 업로드 + CloudFront CDN
C) **Nginx 서버** - 자체 서버에 Nginx로 호스팅
D) **Vercel/Netlify** - 서버리스 플랫폼
X) 기타 (아래 [Answer]: 태그 다음에 설명해주세요)

[Answer]: A

---

### Q2: HTTPS 설정
HTTPS를 어떻게 설정할까요?

A) **AWS Certificate Manager** - AWS에서 무료 SSL 인증서
B) **Let's Encrypt** - 무료 SSL 인증서 (자체 서버)
C) **자체 인증서** - 회사 인증서 사용
D) **HTTP만** - HTTPS 미적용 (개발 환경)
X) 기타 (아래 [Answer]: 태그 다음에 설명해주세요)

[Answer]: B

---

### Q3: 환경 변수 관리
API URL 등 환경 변수를 어떻게 관리할까요?

A) **.env 파일** - 로컬 .env 파일로 관리
B) **AWS Systems Manager** - Parameter Store 사용
C) **환경별 빌드** - dev/prod 별도 빌드
D) **하드코딩** - 코드에 직접 작성
X) 기타 (아래 [Answer]: 태그 다음에 설명해주세요)

[Answer]: A

---

## 다음 단계

위의 모든 [Answer]: 태그를 작성하신 후 알려주시면, 답변을 분석하고 Infrastructure Design 아티팩트를 생성하겠습니다.
