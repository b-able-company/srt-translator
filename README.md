# SRT 자막 번역기 (Desktop)

네이버 클라우드 플랫폼 Papago 번역 API를 이용해 `.srt` 자막을 번역하는 일회용 Electron 데스크톱 앱입니다. 더 이상 개발·배포 계획은 없지만, 실행/빌드 방법과 동작 방식을 간단히 정리했습니다.

## 주요 기능
- Papago NMT API 호출로 SRT 자막 라인 단위 번역
- 원본/번역 매핑 JSON 함께 다운로드
- 번역 중단, 진행률 표시, 기본 단축키 지원 (열기 `Cmd/Ctrl+O`, 저장 `Cmd/Ctrl+S`, 시작 `F5`, 중단 `Esc`)
- 로컬 `localStorage`에 인증 정보를 Base64로만 인코딩해 보관 (보안용 암호화 아님)

## 요구 사항
- Node.js 16+ (Electron 22.x 호환)
- Naver Cloud Platform Papago 번역 API 자격증명 (`Client ID`, `Client Secret`)
- macOS/Windows 어느 쪽이든 실행 가능 (패키징은 `electron-builder`)

## 빠른 시작
```bash
npm install
npm start     # 개발 모드 실행
```

## 번역 흐름
1. 앱 실행 후 **API 설정** 섹션에서 Papago `Client ID`/`Secret`과 Object Storage `Bucket`(UI상 필수)이 입력돼 있어야 함. 값은 로컬 브라우저 `localStorage`에 Base64로 저장됩니다.
2. **파일 업로드**에서 `.srt` 파일을 선택.
3. **번역 설정**에서 원본/대상 언어 선택 (`auto` → 선택한 대상 언어로 변환).
4. **번역 실행**에서 `번역 시작` 클릭 or 메뉴/단축키(`F5`). 진행률이 표시되며 중단 시 `Esc` 또는 `번역 중단`.
5. 완료 후 **결과 확인**에서 번역된 SRT와 원본/번역 매핑 JSON을 다운로드.

## 빌드/배포
```bash
npm run dist      # 기본 패키징 (publish 없음)
npm run build-win # Windows NSIS/portable
npm run build-mac # macOS dmg (universal)
```
산출물은 `dist/`에 생성되며, 아이콘은 `assets/icon.*`을 사용합니다.

## 폴더 구조
- `main.js` : Electron 메인 프로세스, 창/메뉴/IPC
- `index.html` : 렌더러 UI와 Papago 호출 로직
- `assets/` : 아이콘 리소스

## 주의/제한 사항
- Papago API 자격증명을 로컬에 그대로 저장하므로 공유 PC에서는 사용하지 않는 것이 안전합니다.
- Papago 호출 실패 시 해당 라인은 원문으로 대체됩니다.
- Object Storage 업로드/다운로드는 UI 입력만 있고 실제 업로드 로직은 구현되어 있지 않습니다.
- 장기 유지보수 계획이 없는 보관용 코드이므로, 새 프로젝트에 재사용 시 보안/에러처리/테스트를 보완해야 합니다.

## 라이선스
MIT
