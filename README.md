# Tech Knowledge Log

**Schedule:** Mon/Wed/Fri (Fundamentals) | Tue/Thu (Papers)

## Quick Start

```bash
# 1. Clone and setup
git init
git remote add origin https://github.com/YOUR_USERNAME/tech-knowledge-log.git
git push -u origin main

# 2. Enable GitHub Pages
# Settings → Pages → Source: main branch, / (root)

# 3. Import n8n workflow
# Upload: tech-knowledge-log-workflow.json
# Configure: Claude API, GitHub Token, Slack Webhook
```
- Arxiv Paper Workflow
```mermaid
flowchart LR
  A[Schedule Trigger<br/>Every Tuesday 08:27 KST] --> B[Get GitHub User]
  B --> C[Set GitHub Config<br/>owner/repo/branch/folderPath]
  C --> D[Fetch from Arxiv<br/>AI 관련 카테고리 & 키워드 검색]
  D --> E[Parse XML]
  E --> F[Extract Entries<br/>논문 리스트 배열로 정리]
  F --> G[Select Best Paper<br/>가장 트렌디한 논문 1편 선택]
  G --> H[Pick Selected Paper<br/>선택 결과 파싱]
  H --> I[Extract Paper Info<br/>제목/저자/날짜/Arxiv ID 추출]
  I --> J[Translate with GPT-5-mini<br/>한국어 요약 생성]
  J --> K[Create HTML<br/>한국어/영어 요약 포함 HTML 생성]
  K --> L[Upload to GitHub<br/>posts/papers/yyMM/YYY-MM-DD-paper.html]
  K --> M[Send to Slack<br/>논문 정보 DM 알림]
```
- HuggingFace Paper Workflow
```mermaid
flowchart LR
  A[Schedule Trigger<br/>Every Thursday 08:20 KST] --> B[Generate Today's HF Papers URL]
  B --> C[Fetch Hugging Face Page]
  C --> D[Parse Papers Info<br/>추천수 ≥ 30 논문만 추출]
  D --> E[Fetch Paper Detail Page<br/>각 논문 상세 HTML]
  E --> F[Extract Abstract and GitHub<br/>Abstract / Authors / Affiliation / GitHub URL]
  F --> G[Generate Korean Summary<br/>3-5문장 한국어 요약]
  G --> H[Merge Summary<br/>메타정보 + 요약 통합]
  H --> I[Create HTML<br/>KST 기준 발행일/파일명 생성]
  I --> J[Upload to GitHub<br/>Tech Knowledge Log 포스트]
  I --> K[Send to Slack<br/>논문 정보 & 링크 알림]
```
CS Knowledge Workflow
```mermaid
flowchart LR
  A[Schedule Trigger<br/>Mon/Wed/Fri 08:27 KST] --> B[Check Folder Exists<br/>posts/cs-fundamentals/2511]
  B -->|존재| C[Get Existing Topics<br/>GitHub 파일 목록]
  B -->|없음| D[Create Folder<br/>.gitkeep 생성] --> C

  C --> E[Extract Used Topics<br/>파일명에서 topic 추출]
  E --> F[Select New Topic<br/>미사용 CS/AI 핵심 토픽 1개 선택]
  F --> G[Parse Selected Topic<br/>중복/하드코딩 제외 검사]

  G --> H[Generate Topic Content<br/>한/영 설명 & 활용 작성]
  H --> I[Generate HTML File<br/>코드블록/인라인 코드 포맷팅 포함 HTML]
  I --> J[Upload HTML File<br/>YYYY-MM-DD-topic.html]
  I --> K[Send to Slack<br/>블록 형식 알림 + GitHub 링크]
```
